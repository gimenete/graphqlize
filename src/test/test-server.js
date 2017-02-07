const test = require('ava')
const express = require('express')
const graphqlHTTP = require('express-graphql')
const { createSchema } = require('../main')
const fetch = require('node-fetch')

const {
  Query,
  Comment
} = require('./_model')

const schema = createSchema(Query, Comment)
var app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
  context: { foo: 'bar' }
}))

app.listen(3333)

test(t => {
  return fetch('http://127.0.0.1:3333/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      query: '{ list(limit: 10, offset: 1) { text, whatever } }'
    })
  })
  .then(res => res.json())
  .then(body => {
    t.deepEqual(body, {
      'data': {
        'list': [
          {
            'text': 'hello world!',
            'whatever': 'hello world! heyyyyyy bar'
          }
        ]
      }
    })
  })
})
