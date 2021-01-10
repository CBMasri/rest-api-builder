/* eslint-disable no-proto */

/**
 * Extendable error class which allows for a custom error name/message.
 */
class ExtendableError extends Error {
  constructor (message = '') {
    super(message)

    Object.defineProperty(this, 'message', { value: message })
    Object.defineProperty(this, 'name', { value: this.constructor.name })

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor)
    } else {
      Object.defineProperty(this, 'stack', (new Error(message)).stack)
    }
  }
}

class MissingIdError extends ExtendableError {
  constructor (message = 'Unable to complete request: missing resource identifier') {
    super(message)

    this.constructor = MissingIdError
    this.__proto__ = MissingIdError.prototype
  }
}

class MissingPayloadError extends ExtendableError {
  constructor (message = 'Unable to complete request: payload is required') {
    super(message)

    this.constructor = MissingPayloadError
    this.__proto__ = MissingPayloadError.prototype
  }
}

module.exports = {
  MissingIdError,
  MissingPayloadError
}
