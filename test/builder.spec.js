import APIBuilder from '../src/builder'
import { MissingIdError, MissingPayloadError } from '../src/errors.js'

describe('APIBuilder', () => {
  let builder

  beforeEach(() => {
    builder = new APIBuilder({
      requestFn: jest.fn().mockName('requestFn')
    })
  })

  describe('constructor', () => {
    it('leading/trailing slashes are removed from baseURL', () => {
      const builder = new APIBuilder({
        requestFn: () => {},
        baseURL: '/https://example.com/'
      })
      expect(builder.baseURL).toEqual('https://example.com')
    })
  })

  describe('create', () => {
    it('creates default actions if none are given', () => {
      const api = builder.create({ path: 'foo' })
      expect(Object.keys(api).length).toEqual(6)
      expect(api).toHaveProperty('list')
      expect(api).toHaveProperty('retrieve')
      expect(api).toHaveProperty('create')
      expect(api).toHaveProperty('update')
      expect(api).toHaveProperty('partialUpdate')
      expect(api).toHaveProperty('destroy')
    })

    it('creates custom actions using endpoint definitions', () => {
      const api = builder.create({
        path: 'foo',
        endpoints: [
          { action: 'custom1', method: 'get', path: '' },
          { action: 'custom2', method: 'put', path: '' },
          { action: 'custom3', method: 'delete', path: '' }
        ]
      })
      expect(Object.keys(api).length).toEqual(3)
      expect(api).toHaveProperty('custom1')
      expect(api).toHaveProperty('custom2')
      expect(api).toHaveProperty('custom3')
    })

    it('endpoint definitions can be mixed default/custom', () => {
      const api = builder.create({
        path: 'foo',
        endpoints: [
          { action: 'list' },
          { action: 'destroy' },
          { action: 'custom', method: 'get', path: '' }
        ]
      })
      expect(Object.keys(api).length).toEqual(3)
      expect(api).toHaveProperty('list')
      expect(api).toHaveProperty('destroy')
      expect(api).toHaveProperty('custom')
    })
  })

  describe('requestFn', () => {
    describe('parameter validation', () => {
      it('id is required for retrieve, update, partialUpdate, destroy', async () => {
        const api = builder.create({
          path: 'foo',
          endpoints: [
            { action: 'retrieve' },
            { action: 'update' },
            { action: 'partialUpdate' },
            { action: 'destroy' }
          ]
        })
        await expect(api.retrieve()).rejects.toThrow(MissingIdError)
        await expect(api.update()).rejects.toThrow(MissingIdError)
        await expect(api.partialUpdate()).rejects.toThrow(MissingIdError)
        await expect(api.destroy()).rejects.toThrow(MissingIdError)
      })

      it('id is required for custom endpoints with a named segment', async () => {
        const api = builder.create({
          path: 'foo',
          endpoints: [
            { action: 'withoutParam', method: 'get', path: '' },
            { action: 'withParam', method: 'get', path: ':id' }
          ]
        })
        await expect(api.withoutParam()).resolves.not.toThrow()
        await expect(api.withParam()).rejects.toThrow(MissingIdError)
      })

      it('id must be a string or number', async () => {
        const api = builder.create({
          path: 'foo',
          endpoints: [
            { action: 'retrieve' }
          ]
        })
        await expect(api.retrieve(true)).rejects.toThrow(
          TypeError('Invalid type for id (boolean). Allowed types: string, number, object')
        )
      })

      it('payload is required for post, put, patch', async () => {
        const api = builder.create({
          path: 'foo',
          endpoints: [
            { action: 'create' },
            { action: 'update' },
            { action: 'partialUpdate' }
          ]
        })
        await expect(api.create()).rejects.toThrow(MissingPayloadError)
        await expect(api.update(1)).rejects.toThrow(MissingPayloadError)
        await expect(api.partialUpdate(1)).rejects.toThrow(MissingPayloadError)
      })
    })

    describe('config', () => {
      it('includes the http method, data, and url', async () => {
        const api = builder.create({
          path: 'foo',
          endpoints: [
            { action: 'create' }
          ]
        })
        await api.create({ example: 'data' })
        expect(builder.requestFn).toHaveBeenCalledTimes(1)
        expect(builder.requestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'post',
            data: { example: 'data' },
            url: '/foo'
          })
        )
      })
    })
  })

  describe('_parseArgs', () => {
    // it('get (no args)', () => {
    //   const args = [{ extra: 'params' }]
    //   const { id, data, extra } = builder._parseArgs(args, 'get')
    //   expect(id).toEqual(undefined)
    //   expect(data).toEqual(undefined)
    //   expect(extra).toEqual({ extra: 'params' })
    // })

    it('get (with args)', () => {
      const args = [123, { extra: 'params' }]
      const { id, data, extra } = builder._parseArgs(args, 'get')
      expect(id).toEqual(123)
      expect(data).toEqual(undefined)
      expect(extra).toEqual({ extra: 'params' })
    })

    it('post', () => {
      const args = [{ example: 'data' }, { extra: 'params' }]
      const { id, data, extra } = builder._parseArgs(args, 'post')
      expect(id).toEqual(undefined)
      expect(data).toEqual({ example: 'data' })
      expect(extra).toEqual({ extra: 'params' })
    })

    it('put', () => {
      const args = [123, { example: 'data' }, { extra: 'params' }]
      const { id, data, extra } = builder._parseArgs(args, 'put')
      expect(id).toEqual(123)
      expect(data).toEqual({ example: 'data' })
      expect(extra).toEqual({ extra: 'params' })
    })

    it('patch', () => {
      const args = [123, { example: 'data' }, { extra: 'params' }]
      const { id, data, extra } = builder._parseArgs(args, 'patch')
      expect(id).toEqual(123)
      expect(data).toEqual({ example: 'data' })
      expect(extra).toEqual({ extra: 'params' })
    })

    it('delete', () => {
      const args = [123, { extra: 'params' }]
      const { id, data, extra } = builder._parseArgs(args, 'delete')
      expect(id).toEqual(123)
      expect(data).toEqual(undefined)
      expect(extra).toEqual({ extra: 'params' })
    })
  })

  describe('_buildURL', () => {
    it('id can be a string or number when there is a single resource identifier', async () => {

    })

    it('id must be an object when there are multiple resource identifiers', async () => {

    })
  })
})
