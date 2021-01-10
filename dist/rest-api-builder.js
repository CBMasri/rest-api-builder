(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("rest-api-builder", [], factory);
	else if(typeof exports === 'object')
		exports["rest-api-builder"] = factory();
	else
		root["rest-api-builder"] = factory();
})(this, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/builder.js":
/*!************************!*\
  !*** ./src/builder.js ***!
  \************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  pathToRegexp,
  compile
} = __webpack_require__(/*! path-to-regexp */ "./node_modules/path-to-regexp/dist.es2015/index.js");

const {
  MissingIdError,
  MissingPayloadError
} = __webpack_require__(/*! ./errors.js */ "./src/errors.js");

const {
  validateConfig,
  validateEndpoints
} = __webpack_require__(/*! ./validation.js */ "./src/validation.js");

const {
  cleanURLSegment
} = __webpack_require__(/*! ./utils.js */ "./src/utils.js");

class APIBuilder {
  /**
   * Instantiate the builder.
   *
   * @param {Object} config - configuration object
   * @param {Function} config.requestFn - Request handler
   * @param {String} [config.baseURL] - Base URL path that will be prepended to all routes
   */
  constructor(config = {}) {
    const {
      baseURL = '',
      requestFn = null
    } = config;
    validateConfig(config);
    this.baseURL = cleanURLSegment(baseURL);
    this.requestFn = requestFn;
    this.defaultActions = {
      list: {
        method: 'get',
        path: ''
      },
      retrieve: {
        method: 'get',
        path: ':id'
      },
      create: {
        method: 'post',
        path: ''
      },
      update: {
        method: 'put',
        path: ':id'
      },
      partialUpdate: {
        method: 'patch',
        path: ':id'
      },
      destroy: {
        method: 'delete',
        path: ':id'
      }
    };
  }
  /**
   * Build the rest api endpoints.
   *
   * @param {Object} config - endpoint configuration
   * @param {String} config.path - route path
   * @param {Object[]} config.endpoints - list of endpoint definitions
   * @returns {Object}
   */


  create(config = {}) {
    const {
      path = '',
      endpoints = []
    } = config;

    if (!path) {
      throw new Error('path is required');
    }

    if (typeof path !== 'string') {
      throw new TypeError('path must be a string');
    }

    validateEndpoints(endpoints);

    if (!endpoints.length) {
      return this._createDefaultActions(path);
    }

    return this._createActions(endpoints, path);
  }
  /**
   * When no actions are specified by the user,
   * create the defaults.
   *
   * @param {String} path
   * @returns {Object}
   */


  _createDefaultActions(path) {
    const actions = {};

    for (const [action, config] of Object.entries(this.defaultActions)) {
      actions[action] = this._requestFn(path, config);
    }

    return actions;
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


  _createActions(endpoints, path) {
    const actions = {};

    for (let config of endpoints) {
      const action = config.action;

      if (this.defaultActions.hasOwnProperty(action)) {
        config = this.defaultActions[action];
      } else {
        config.method = config.method.toLowerCase();
      }

      actions[action] = this._requestFn(path, config);
    }

    return actions;
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


  _requestFn(basePath, config) {
    const idRequired = this._idRequired(config);

    const payloadRequired = this._payloadRequired(config);

    return async (...args) => {
      const {
        id,
        data,
        extra
      } = this._parseArgs(args, config);

      if (idRequired) {
        if (id === undefined) {
          throw new MissingIdError();
        }

        if (!['string', 'number', 'object'].includes(typeof id)) {
          throw new TypeError(`Invalid type for id (${typeof id}). Allowed types: string, number, object`);
        }
      }

      if (payloadRequired && data === undefined) {
        throw new MissingPayloadError();
      }

      const requestConfig = {
        method: config.method,
        url: this._buildUrl(basePath, config.path, id),
        ...extra
      };

      if (data !== undefined) {
        requestConfig.data = data;
      }

      return this.requestFn(requestConfig);
    };
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


  _idRequired(endpoint) {
    const requireId = ['retrieve', 'update', 'partialUpdate', 'destroy'];
    const hasNamedSegment = endpoint.path.includes(':');
    return requireId.includes(endpoint.action) || hasNamedSegment;
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


  _payloadRequired(endpoint) {
    const requirePayload = ['post', 'put', 'patch'];
    return requirePayload.includes(endpoint.method);
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


  _parseArgs(args, config) {
    let id, data, extra; // If `id` is required, `extra` will be either the
    // 2nd or 3rd argument depending on the http method

    if (this._idRequired(config)) {
      id = args[0];
      extra = args[1];

      if (this._payloadRequired(config)) {
        data = args[1];
        extra = args[2];
      }
    } else {
      switch (config.method) {
        case 'get':
        case 'delete':
          extra = args[0];
          break;

        case 'post':
        case 'put':
        case 'patch':
          data = args[0];
          extra = args[1];
          break;
      }
    }

    extra = extra || {};
    return {
      id,
      data,
      extra
    };
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


  _buildUrl(basePath, path, id) {
    let url = cleanURLSegment(basePath);

    if (path) {
      const toPath = compile(path, {
        encode: encodeURIComponent
      });
      const idIsObj = typeof id === 'object'; // Collect named url params from path

      const keys = [];
      pathToRegexp(path, keys); // Fill in those values using the id

      if (keys.length > 0) {
        if (id === undefined) {
          throw new Error('path specifies a named param but no id was given');
        }

        if (keys.length === 1) {
          if (idIsObj) {
            throw new TypeError('Received non-primitive value for id');
          }

          url += `/${toPath({
            [keys[0].name]: id
          })}/`;
        } else {
          if (!idIsObj) {
            throw new Error('Expected object id for path with multiple named params');
          }

          url += `/${toPath(id)}/`;
        }
      } else {
        url += `/${toPath()}/`;
      }
    }

    return this.baseURL ? `${this.baseURL}/${url}` : `/${url}`;
  }

}

module.exports = APIBuilder;

/***/ }),

/***/ "./src/constants.js":
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
/***/ ((module) => {

// Constants
const HTTP_METHODS = ['head', 'get', 'post', 'put', 'patch', 'delete'];
const DEFAULT_ACTIONS = ['list', 'retrieve', 'create', 'update', 'partialUpdate', 'destroy'];
module.exports = {
  HTTP_METHODS,
  DEFAULT_ACTIONS
};

/***/ }),

/***/ "./src/errors.js":
/*!***********************!*\
  !*** ./src/errors.js ***!
  \***********************/
/***/ ((module) => {

/* eslint-disable no-proto */

/**
 * Extendable error class which allows for a custom error name/message.
 */
class ExtendableError extends Error {
  constructor(message = '') {
    super(message);
    Object.defineProperty(this, 'message', {
      value: message
    });
    Object.defineProperty(this, 'name', {
      value: this.constructor.name
    });

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      Object.defineProperty(this, 'stack', new Error(message).stack);
    }
  }

}

class MissingIdError extends ExtendableError {
  constructor(message = 'Unable to complete request: missing resource identifier') {
    super(message);
    this.constructor = MissingIdError;
    this.__proto__ = MissingIdError.prototype;
  }

}

class MissingPayloadError extends ExtendableError {
  constructor(message = 'Unable to complete request: payload is required') {
    super(message);
    this.constructor = MissingPayloadError;
    this.__proto__ = MissingPayloadError.prototype;
  }

}

module.exports = {
  MissingIdError,
  MissingPayloadError
};

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/***/ ((module) => {

/**
 * Trim leading and trailing slashes.
 *
 * @param {String} path
 */
function cleanURLSegment(segment) {
  if (segment.startsWith('/')) {
    segment = segment.slice(1);
  }

  if (segment.endsWith('/')) {
    segment = segment.slice(0, -1);
  }

  return segment;
}

module.exports = {
  cleanURLSegment
};

/***/ }),

/***/ "./src/validation.js":
/*!***************************!*\
  !*** ./src/validation.js ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  DEFAULT_ACTIONS,
  HTTP_METHODS
} = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
/**
 * Validate the APIBuilder configuration.
 *
 * @param {Object} config - Builder configuration options
 * @param {Function} config.requestFn - Request handler
 * @param {String} [config.baseURL] - Base URL path that will be prepended to all routes
 * @returns {Boolean}
 */


function validateConfig(config) {
  if (!config.hasOwnProperty('requestFn')) {
    throw new Error('requestFn is required');
  }

  if (typeof config.requestFn !== 'function') {
    throw new TypeError('requestFn must be a function');
  }

  if (config.hasOwnProperty('baseURL') && typeof config.baseURL !== 'string') {
    throw new TypeError('baseURL must be a string');
  }
}
/**
 * Validate the endpoint schema contains well-formed data.
 *
 * @param {Object[]} endpoints
 * @returns {Boolean}
 */


function validateEndpoints(endpoints) {
  for (const [index, endpoint] of endpoints.entries()) {
    // All endpoints need an action
    if (!endpoint.action) {
      throw new Error(`endpoint at pos ${index} is missing an action`);
    } // Custom endpoints must also define the http method and path


    if (!DEFAULT_ACTIONS.includes(endpoint.action)) {
      if (!endpoint.method) {
        throw new Error(`endpoint at pos ${index} is missing a method`);
      }

      if (!HTTP_METHODS.includes(endpoint.method.toLowerCase())) {
        throw new Error(`
          endpoint at pos ${index} has an unknown method: ${endpoint.method}\n
          The allowed http methods are: ${HTTP_METHODS.join(', ')}
        `);
      }

      if (!endpoint.hasOwnProperty('path')) {
        throw new Error(`endpoint at pos ${index} is missing a path`);
      }

      if (typeof endpoint.path !== 'string') {
        throw new TypeError(`endpoint at pos ${index} has an invalid type for path: ${typeof endpoint.path}`);
      }
    }
  }
}

module.exports = {
  validateConfig,
  validateEndpoints
};

/***/ }),

/***/ "./node_modules/path-to-regexp/dist.es2015/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/path-to-regexp/dist.es2015/index.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "parse": () => /* binding */ parse,
/* harmony export */   "compile": () => /* binding */ compile,
/* harmony export */   "tokensToFunction": () => /* binding */ tokensToFunction,
/* harmony export */   "match": () => /* binding */ match,
/* harmony export */   "regexpToFunction": () => /* binding */ regexpToFunction,
/* harmony export */   "tokensToRegexp": () => /* binding */ tokensToRegexp,
/* harmony export */   "pathToRegexp": () => /* binding */ pathToRegexp
/* harmony export */ });
/**
 * Tokenize input string.
 */
function lexer(str) {
    var tokens = [];
    var i = 0;
    while (i < str.length) {
        var char = str[i];
        if (char === "*" || char === "+" || char === "?") {
            tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
            continue;
        }
        if (char === "\\") {
            tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
            continue;
        }
        if (char === "{") {
            tokens.push({ type: "OPEN", index: i, value: str[i++] });
            continue;
        }
        if (char === "}") {
            tokens.push({ type: "CLOSE", index: i, value: str[i++] });
            continue;
        }
        if (char === ":") {
            var name = "";
            var j = i + 1;
            while (j < str.length) {
                var code = str.charCodeAt(j);
                if (
                // `0-9`
                (code >= 48 && code <= 57) ||
                    // `A-Z`
                    (code >= 65 && code <= 90) ||
                    // `a-z`
                    (code >= 97 && code <= 122) ||
                    // `_`
                    code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name)
                throw new TypeError("Missing parameter name at " + i);
            tokens.push({ type: "NAME", index: i, value: name });
            i = j;
            continue;
        }
        if (char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at " + j);
            }
            while (j < str.length) {
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                }
                else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at " + j);
                    }
                }
                pattern += str[j++];
            }
            if (count)
                throw new TypeError("Unbalanced pattern at " + i);
            if (!pattern)
                throw new TypeError("Missing pattern at " + i);
            tokens.push({ type: "PATTERN", index: i, value: pattern });
            i = j;
            continue;
        }
        tokens.push({ type: "CHAR", index: i, value: str[i++] });
    }
    tokens.push({ type: "END", index: i, value: "" });
    return tokens;
}
/**
 * Parse a string for the raw tokens.
 */
function parse(str, options) {
    if (options === void 0) { options = {}; }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function (type) {
        if (i < tokens.length && tokens[i].type === type)
            return tokens[i++].value;
    };
    var mustConsume = function (type) {
        var value = tryConsume(type);
        if (value !== undefined)
            return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
    };
    var consumeText = function () {
        var result = "";
        var value;
        // tslint:disable-next-line
        while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
            result += value;
        }
        return result;
    };
    while (i < tokens.length) {
        var char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || ""
            });
            continue;
        }
        var value = char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || ""
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
/**
 * Compile a string to a template function for the path.
 */
function compile(str, options) {
    return tokensToFunction(parse(str, options), options);
}
/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction(tokens, options) {
    if (options === void 0) { options = {}; }
    var reFlags = flags(options);
    var _a = options.encode, encode = _a === void 0 ? function (x) { return x; } : _a, _b = options.validate, validate = _b === void 0 ? true : _b;
    // Compile all the tokens into regexps.
    var matches = tokens.map(function (token) {
        if (typeof token === "object") {
            return new RegExp("^(?:" + token.pattern + ")$", reFlags);
        }
    });
    return function (data) {
        var path = "";
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (typeof token === "string") {
                path += token;
                continue;
            }
            var value = data ? data[token.name] : undefined;
            var optional = token.modifier === "?" || token.modifier === "*";
            var repeat = token.modifier === "*" || token.modifier === "+";
            if (Array.isArray(value)) {
                if (!repeat) {
                    throw new TypeError("Expected \"" + token.name + "\" to not repeat, but got an array");
                }
                if (value.length === 0) {
                    if (optional)
                        continue;
                    throw new TypeError("Expected \"" + token.name + "\" to not be empty");
                }
                for (var j = 0; j < value.length; j++) {
                    var segment = encode(value[j], token);
                    if (validate && !matches[i].test(segment)) {
                        throw new TypeError("Expected all \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
                    }
                    path += token.prefix + segment + token.suffix;
                }
                continue;
            }
            if (typeof value === "string" || typeof value === "number") {
                var segment = encode(String(value), token);
                if (validate && !matches[i].test(segment)) {
                    throw new TypeError("Expected \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
                }
                path += token.prefix + segment + token.suffix;
                continue;
            }
            if (optional)
                continue;
            var typeOfMessage = repeat ? "an array" : "a string";
            throw new TypeError("Expected \"" + token.name + "\" to be " + typeOfMessage);
        }
        return path;
    };
}
/**
 * Create path match function from `path-to-regexp` spec.
 */
function match(str, options) {
    var keys = [];
    var re = pathToRegexp(str, keys, options);
    return regexpToFunction(re, keys, options);
}
/**
 * Create a path match function from `path-to-regexp` output.
 */
function regexpToFunction(re, keys, options) {
    if (options === void 0) { options = {}; }
    var _a = options.decode, decode = _a === void 0 ? function (x) { return x; } : _a;
    return function (pathname) {
        var m = re.exec(pathname);
        if (!m)
            return false;
        var path = m[0], index = m.index;
        var params = Object.create(null);
        var _loop_1 = function (i) {
            // tslint:disable-next-line
            if (m[i] === undefined)
                return "continue";
            var key = keys[i - 1];
            if (key.modifier === "*" || key.modifier === "+") {
                params[key.name] = m[i].split(key.prefix + key.suffix).map(function (value) {
                    return decode(value, key);
                });
            }
            else {
                params[key.name] = decode(m[i], key);
            }
        };
        for (var i = 1; i < m.length; i++) {
            _loop_1(i);
        }
        return { path: path, index: index, params: params };
    };
}
/**
 * Escape a regular expression string.
 */
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */
function flags(options) {
    return options && options.sensitive ? "" : "i";
}
/**
 * Pull out keys from a regexp.
 */
function regexpToRegexp(path, keys) {
    if (!keys)
        return path;
    var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
    var index = 0;
    var execResult = groupsRegex.exec(path.source);
    while (execResult) {
        keys.push({
            // Use parenthesized substring match if available, index otherwise
            name: execResult[1] || index++,
            prefix: "",
            suffix: "",
            modifier: "",
            pattern: ""
        });
        execResult = groupsRegex.exec(path.source);
    }
    return path;
}
/**
 * Transform an array into a regexp.
 */
function arrayToRegexp(paths, keys, options) {
    var parts = paths.map(function (path) { return pathToRegexp(path, keys, options).source; });
    return new RegExp("(?:" + parts.join("|") + ")", flags(options));
}
/**
 * Create a path regexp from string input.
 */
function stringToRegexp(path, keys, options) {
    return tokensToRegexp(parse(path, options), keys, options);
}
/**
 * Expose a function for taking tokens and returning a RegExp.
 */
function tokensToRegexp(tokens, keys, options) {
    if (options === void 0) { options = {}; }
    var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function (x) { return x; } : _d;
    var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
    var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
    var route = start ? "^" : "";
    // Iterate over the tokens and create our regexp string.
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (typeof token === "string") {
            route += escapeString(encode(token));
        }
        else {
            var prefix = escapeString(encode(token.prefix));
            var suffix = escapeString(encode(token.suffix));
            if (token.pattern) {
                if (keys)
                    keys.push(token);
                if (prefix || suffix) {
                    if (token.modifier === "+" || token.modifier === "*") {
                        var mod = token.modifier === "*" ? "?" : "";
                        route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
                    }
                    else {
                        route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
                    }
                }
                else {
                    route += "(" + token.pattern + ")" + token.modifier;
                }
            }
            else {
                route += "(?:" + prefix + suffix + ")" + token.modifier;
            }
        }
    }
    if (end) {
        if (!strict)
            route += delimiter + "?";
        route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
    }
    else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string"
            ? delimiter.indexOf(endToken[endToken.length - 1]) > -1
            : // tslint:disable-next-line
                endToken === undefined;
        if (!strict) {
            route += "(?:" + delimiter + "(?=" + endsWith + "))?";
        }
        if (!isEndDelimited) {
            route += "(?=" + delimiter + "|" + endsWith + ")";
        }
    }
    return new RegExp(route, flags(options));
}
/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */
function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp)
        return regexpToRegexp(path, keys);
    if (Array.isArray(path))
        return arrayToRegexp(path, keys, options);
    return stringToRegexp(path, keys, options);
}
//# sourceMappingURL=index.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__("./src/builder.js");
/******/ })()
;
});
//# sourceMappingURL=rest-api-builder.map