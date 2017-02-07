# Graphqlize

Warning: **Work In Progress**

This library creates a GraphQL schema from plain JavaScript classes. With this code:

```javascript
class Query {
  /**
   * List a few comments
   * @param {number} offset - The offset of...
   * @param {number} limit - The limit of...
   * @param {int} limit
   * @param {int} offset
   * @return {Comment[]} - The result of...
   */
  static list (limit, offset) {
    return [{
      text: 'hello world!'
    }]
  }
}

class Comment {
  constructor () {
    /** @type {string!} - The id of a comment */
    this.id = null
    /** @type {string} - The content of a comment */
    this.text = null
    /** @type {boolean} - Flag that indicates if the comment was deleted */
    this.deleted = null
  }

  /**
   * Gets whatever
   * @param {context} ctxt
   * @return {string} - The result of...
   */
  whatever (ctxt) {
    return Promise.resolve(this.text + ' heyyyyyy ' + ctxt.foo)
  }
}
```

Just using `graphqlize`

````javascript
const { createSchema } = require('graphqlize')
const schema = createSchema(Query, Comment)
```

You get a GraphQL schema with this schema:

```
type Comment {
  # The id of a comment
  id: String!

  # The content of a comment
  text: String

  # Flag that indicates if the comment was deleted
  deleted: Boolean
  whatever: String
}

type Query {
  list(limit: Int, offset: Int): [Comment]
}
```

Once you have the schema you can run a server with it:

```javascript
var app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
  context: {}
}))
```

## Based on JSDocs

Each class represents a GraphQL `type`. You annotate the classes with standard JSDocs attributes. It supports the following types:

- string: maps to GraphQLString
- number or float: maps to GraphQLFloat
- int: maps to GraphQLInt
- boolean: maps to GraphQLBoolean
- ID: GraphQLID
- Custom types
- Arrays of any previous type
- not-nullability with `{type!}`
- using `@param {context}` in a particular field you will get the GraphQL context injected for that argument

You just need to call `createSchema` passing all the types/classes that you want to expose

```javascript
createSchema(Query, Class2, Class3,...)
```

The first class will be the `root` in the schema. Methods act like attributes with arguments. They can be `static` or not.
