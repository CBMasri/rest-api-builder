import { DEFAULT_ACTIONS, HTTP_METHODS } from './constants.js'

/**
 * Validate the APIBuilder configuration.
 *
 * @param {Object} config - Builder configuration options
 * @param {Function} config.requestFn - Request handler
 * @param {String} [config.baseURL] - Base URL path that will be prepended to all routes
 * @returns {Boolean}
 */
export function validateConfig (config) {
  if (!config.hasOwnProperty('requestFn')) {
    throw new Error('requestFn is required')
  }
  if (typeof config.requestFn !== 'function') {
    throw new TypeError('requestFn must be a function')
  }
  if (config.hasOwnProperty('baseURL') && typeof config.baseURL !== 'string') {
    throw new TypeError('baseURL must be a string')
  }
}

/**
 * Validate the endpoint schema contains well-formed data.
 *
 * @param {Object[]} endpoints
 * @returns {Boolean}
 */
export function validateEndpoints (endpoints) {
  for (const [index, endpoint] of endpoints.entries()) {
    // All endpoints need an action
    if (!endpoint.action) {
      throw new Error(`endpoint at pos ${index} is missing an action`)
    }
    // Custom endpoints must also define the http method and path
    if (!DEFAULT_ACTIONS.includes(endpoint.action)) {
      if (!endpoint.method) {
        throw new Error(`endpoint at pos ${index} is missing a method`)
      }
      if (!HTTP_METHODS.includes(endpoint.method.toLowerCase())) {
        throw new Error(`
          endpoint at pos ${index} has an unknown method: ${endpoint.method}\n
          The allowed http methods are: ${HTTP_METHODS.join(', ')}
        `)
      }
      if (!endpoint.hasOwnProperty('path')) {
        throw new Error(`endpoint at pos ${index} is missing a path`)
      }
      if (typeof endpoint.path !== 'string') {
        throw new TypeError(
          `endpoint at pos ${index} has an invalid type for path: ${typeof endpoint.path}`
        )
      }
    }
  }
}
