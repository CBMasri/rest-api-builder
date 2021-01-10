const RestAPIBuilder = require('../src/builder.js')

const request = config => {
  console.log('requestFn called with the following config:', config)
}

const builder = new RestAPIBuilder({
  requestFn: request,
  baseURL: 'https://example.com'
})

const MyAPI = {
  foo: builder.create({
    path: 'bar',
    endpoints: [
      { action: 'list' },
      { action: 'retrieve' },
      { action: 'custom1', method: 'get', path: ':n1' },
      { action: 'custom2', method: 'put', path: ':n1/baz/:n2' },
      { action: 'custom3', method: 'post', path: 'baz/:n1' },
      { action: 'custom4', method: 'delete', path: 'baz/:n1' }
    ]
  })
}

console.log('MyAPI:', MyAPI)

const extraConfig = { params: { q: 'example' } }

MyAPI.foo.list(extraConfig)
MyAPI.foo.retrieve(1, extraConfig)
MyAPI.foo.custom1(1, extraConfig)
MyAPI.foo.custom2({ n1: 1, n2: 2 }, null, extraConfig)
MyAPI.foo.custom3(1, null, extraConfig)
MyAPI.foo.custom4(1, extraConfig)
