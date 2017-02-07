const test = require('ava')
const { graphql } = require('graphql')
const { createSchema } = require('../main')

const {
  Query,
  Comment
} = require('./_model')

test(t => {
  const schema = createSchema(Query, Comment)

  return graphql(schema, '{ list(limit: 10, offset: 1) { text, whatever } }', {}, { foo: 'bar' })
    .then((response) => {
      t.deepEqual(response, {
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
