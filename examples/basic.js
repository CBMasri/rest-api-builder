const RestAPIBuilder = require('../src/builder.js')

const request = config => {
  console.log('requestFn called with the following config:', config)
}

const builder = new RestAPIBuilder({
  requestFn: request
})

const MyAPI = {
  foo: builder.create({
    path: 'foo'
  })
}

console.log('MyAPI:', MyAPI)

MyAPI.foo.list()
MyAPI.foo.retrieve(1)
MyAPI.foo.create({ test: 'data' })
MyAPI.foo.update(1, { test: 'data' })
MyAPI.foo.partialUpdate(1, { test: 'data' })
MyAPI.foo.destroy(1)
