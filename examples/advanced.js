import RestAPIBuilder from '../src/builder.js'

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
      { action: 'retrieve' },
      { action: 'custom1', method: 'get', path: ':n1' },
      { action: 'custom2', method: 'put', path: ':n1/baz/:n2' }
    ]
  })
}

console.log('MyAPI:', MyAPI)

const params = { params: { q: 'example' } }

MyAPI.foo.retrieve(1, params)
MyAPI.foo.custom1(1, params)
MyAPI.foo.custom2({ n1: 1, n2: 2 }, null, params)
