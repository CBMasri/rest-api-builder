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
  })
})
