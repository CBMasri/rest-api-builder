import APIBuilder from '../src/builder'

/* eslint-disable no-new */

describe('validation', () => {
  describe('constructor', () => {
    it('requestFn is required', () => {
      expect(() => {
        new APIBuilder()
      }).toThrow('requestFn is required')
    })

    it('requestFn must be a function', () => {
      expect(() => {
        new APIBuilder({ requestFn: {} })
      }).toThrow('requestFn must be a function')
      expect(() => {
        new APIBuilder({ requestFn: null })
      }).toThrow('requestFn must be a function')
      expect(() => {
        new APIBuilder({ requestFn: 'str' })
      }).toThrow('requestFn must be a function')
    })

    it('baseURL must be a string', () => {
      expect(() => {
        new APIBuilder({
          requestFn: () => {},
          baseURL: 123
        })
      }).toThrow('baseURL must be a string')
    })
  })

  describe('create', () => {
    let builder

    beforeEach(() => {
      builder = new APIBuilder({
        requestFn: jest.fn().mockName('requestFn')
      })
    })

    it('path is required', () => {
      expect(builder.create).toThrow('path is required')
    })

    it('path must be a string', () => {
      expect(() => {
        builder.create({ path: {} })
      }).toThrow('path must be a string')
    })

    it('each endpoint must specify an action', () => {
      expect(() => {
        builder.create({
          path: 'foo',
          endpoints: [
            { method: 'get', path: 'bar' }
          ]
        })
      }).toThrow('endpoint at pos 0 is missing an action')
    })

    it('custom endpoints must specify an http method', () => {
      expect(() => {
        builder.create({
          path: 'foo',
          endpoints: [
            { action: 'custom', path: 'bar' }
          ]
        })
      }).toThrow('endpoint at pos 0 is missing a method')
    })

    it('http method must be a known value', () => {
      expect(() => {
        builder.create({
          path: 'foo',
          endpoints: [
            { action: 'custom', method: 'notamethod', path: 'bar' }
          ]
        })
      }).toThrow('endpoint at pos 0 has an unknown method')
    })

    it('custom endpoints must specify a path', () => {
      expect(() => {
        builder.create({
          path: 'foo',
          endpoints: [
            { action: 'custom', method: 'get' }
          ]
        })
      }).toThrow('endpoint at pos 0 is missing a path')
    })

    it('path must be a string', () => {
      expect(() => {
        builder.create({
          path: 'foo',
          endpoints: [
            { action: 'custom', method: 'get', path: {} }
          ]
        })
      }).toThrow('endpoint at pos 0 has an invalid type for path')
    })
  })
})
