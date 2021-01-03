import { pathToRegexp, compile } from 'path-to-regexp'

import { MissingIdError, MissingPayloadError } from './errors.js'
import { validateConfig, validateEndpoints } from './validation.js'
import { cleanURLSegment } from './utils.js'

export default class APIBuilder {
  /**
   * Instantiate the builder.
   *
   * @param {Object} config - configuration object
   * @param {Function} config.requestFn - Request handler
   * @param {String} [config.baseURL] - Base URL path that will be prepended to all routes
   */
  constructor (config = {}) {
    const {
      baseURL = '',
      requestFn = null
    } = config

    validateConfig(config)

    this.baseURL = cleanURLSegment(baseURL)
    this.requestFn = requestFn
    this.defaultActions = {
      list: { method: 'get', path: '' },
      retrieve: { method: 'get', path: ':id' },
      create: { method: 'post', path: '' },
      update: { method: 'put', path: ':id' },
      partialUpdate: { method: 'patch', path: ':id' },
      destroy: { method: 'delete', path: ':id' }
    }
  }

  /**
   * Build the rest api endpoints.
   *
   * @param {Object} config - endpoint configuration
   * @param {String} config.path - route path
   * @param {Object[]} config.endpoints - list of endpoint definitions
   * @returns {Object}
   */
  create (config = {}) {
    const {
      path = '',
      endpoints = []
    } = config

    if (!path) {
      throw new Error('path is required')
    }
    if (typeof path !== 'string') {
      throw new TypeError('path must be a string')
    }

    validateEndpoints(endpoints)

    if (!endpoints.length) {
      return this._createDefaultActions(path)
    }
    return this._createActions(endpoints, path)
  }

  /**
   * When no actions are specified by the user,
   * create the defaults.
   *
   * @param {String} path
   * @returns {Object}
   */
  _createDefaultActions (path) {
    const actions = {}

    for (const [action, config] of Object.entries(this.defaultActions)) {
      actions[action] = this._requestFn(path, config)
    }
    return actions
  }

  /**
   * Generate an action using the user-provided
   * configration object. These can be the default
   * actions (eg. list, retrieve, update) or custom
   * actions which define their own path.
   *
   * @param {Object[]} endpoints
   * @param {String} path
   * @returns {Object}
   */
  _createActions (endpoints, path) {
    const actions = {}

    for (let config of endpoints) {
      const action = config.action

      if (this.defaultActions.hasOwnProperty(action)) {
        config = this.defaultActions[action]
      } else {
        config.method = config.method.toLowerCase()
      }
      actions[action] = this._requestFn(path, config)
    }
    return actions
  }

  /**
   * Creates a method which calls the requestFn, and pass
   * it the request config object.
   *
   * This method can be invoked using the `action` param.
   *
   * @param {String} basePath
   * @param {Object} config - route configration
   * @param {String} config.method - http verb
   * @param {String} config.path - route path
   * @param {String} [config.action] - action name, only set if custom
   * @returns {Function}
   */
  _requestFn (basePath, config) {
    const idRequired = this._idRequired(config)
    const payloadRequired = this._payloadRequired(config)

    return async (...args) => {
      const { id, data, extra } = this._parseArgs(args, config)

      if (idRequired) {
        if (id === undefined) {
          throw new MissingIdError()
        }
        if (!['string', 'number', 'object'].includes(typeof id)) {
          throw new TypeError(
            `Invalid type for id (${typeof id}). Allowed types: string, number, object`
          )
        }
      }
      if (payloadRequired && data === undefined) {
        throw new MissingPayloadError()
      }

      const requestConfig = {
        method: config.method,
        url: this._buildUrl(basePath, config.path, id),
        ...extra
      }
      if (data !== undefined) {
        requestConfig.data = data
      }

      return this.requestFn(requestConfig)
    }
  }

  /**
   * Determine if the invocation method should accept
   * an `id` parameter.
   *
   * The id wil be required for retrieve, update, partialUpdate
   * destroy, or if a custom path is used which contains at
   * least one named segment.
   *
   * @param {Object} endpoint - endpoint config
   * @return {Boolean}
   */
  _idRequired (endpoint) {
    const requireId = ['retrieve', 'update', 'partialUpdate', 'destroy']
    const hasNamedSegment = endpoint.path.includes(':')
    return requireId.includes(endpoint.action) || hasNamedSegment
  }

  /**
   * Determines if the invocation method should
   * accept a `data` parameter.
   *
   * A payload will be required for POST, PUT, PATCH.
   *
   * @param {Object} endpoint - endpoint config
   * @returns {Boolean}
   */
  _payloadRequired (endpoint) {
    const requirePayload = ['post', 'put', 'patch']
    return requirePayload.includes(endpoint.method)
  }

  /**
   * Parse the requestFn arguments into `id`,
   * `data`, and `extra`. The order of args
   * will differ based on the http method.
   *
   * @param {Array} args - requestFn arguments
   * @param {Object} config - endpoint config
   * @param {String} config.method - http method
   * @param {String} config.path - route path
   * @param {String} [config.action] - action name, only set if custom
   * @returns {Object}
   */
  _parseArgs (args, config) {
    let id, data, extra

    // If `id` is required, `extra` will be either the
    // 2nd or 3rd argument depending on the http method
    if (this._idRequired(config)) {
      id = args[0]
      extra = args[1]
      if (this._payloadRequired(config)) {
        data = args[1]
        extra = args[2]
      }
    } else {
      switch (config.method) {
        case 'get':
        case 'delete':
          extra = args[0]
          break
        case 'post':
        case 'put':
        case 'patch':
          data = args[0]
          extra = args[1]
          break
      }
    }
    extra = extra || {}
    return { id, data, extra }
  }

  /**
   * Construct the url which will be used to make
   * requests to the server.
   *
   * @param {String} basePath - base path to resource
   * @param {String} path - route path, will be appended to basePath
   * @param {(String|Number|Object)} [id] - resource identifier(s)
   * @returns {String}
   */
  _buildUrl (basePath, path, id) {
    let url = cleanURLSegment(basePath)

    if (path) {
      const toPath = compile(path, { encode: encodeURIComponent })
      const idIsObj = typeof id === 'object'

      // Collect named url params from path
      const keys = []
      pathToRegexp(path, keys)

      // Fill in those values using the id
      if (keys.length > 0) {
        if (id === undefined) {
          throw new Error('path specifies a named param but no id was given')
        }
        if (keys.length === 1) {
          if (idIsObj) {
            throw new TypeError('Received non-primitive value for id')
          }
          url += `/${toPath({ [keys[0].name]: id })}/`
        } else {
          if (!idIsObj) {
            throw new Error('Expected object id for path with multiple named params')
          }
          url += `/${toPath(id)}/`
        }
      } else {
        url += `/${toPath()}/`
      }
    }
    return this.baseURL ? `${this.baseURL}/${url}` : `/${url}`
  }
}
