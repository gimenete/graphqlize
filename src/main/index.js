const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLID,
  GraphQLSchema,
  // GraphQLInputObjectType,
  // GraphQLOutputType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean
} = require('graphql')
const esprima = require('esprima')
const escodegen = require('escodegen')
const doctrine = require('doctrine')

exports.parse = (func) => {
  let ast = esprima.parse(func.toString(), { comment: true, range: true, tokens: true })
  ast = escodegen.attachComments(ast, ast.comments, ast.tokens)

  const classDeclaration = ast.body[0]
  const classBody = classDeclaration.body.body
  const allMethods = classBody.filter((node) => node.type === 'MethodDefinition')

  const methods = allMethods.filter((method) => method.key.name !== 'constructor')

  const data = {
    name: func.name,
    methods: [],
    attributes: []
  }
  methods.forEach((method) => {
    const info = {
      name: method.key.name,
      return: {},
      attributes: []
    }
    const paramsInfo = {}
    method.leadingComments.forEach((comment) => {
      const jsdoc = doctrine.parse(comment.value, { unwrap: true })
      jsdoc.tags.forEach((tag) => {
        if (tag.title === 'param') {
          const { name } = tag
          const param = paramsInfo[name] || { name }
          param.type = tag.type.name
          param.description = param.description || tag.description || (tag.type.expression && tag.type.expression.name)
          param.nullable = tag.type.type !== 'NonNullableType'
          paramsInfo[name] = param
        } else if (tag.title === 'return') {
          info.return.type = info.return.type || tag.type.name
          info.return.array = tag.type.expression && tag.type.expression.name === 'Array'
          if (info.return.array) {
            info.return.type = tag.type.applications[0].name
          }
          info.return.nullable = tag.type.type !== 'NonNullableType'
          info.return.description = info.return.description || tag.description
        }
      })
    })
    const methodFunction = method.value
    info.params = methodFunction.params.map((param) => {
      const { name } = param
      return paramsInfo[name] || { name }
    })
    data.methods.push(info)
  })

  const constructor = allMethods.find((method) => method.key.name === 'constructor')
  if (constructor) {
    const constructorFunction = constructor.value
    const block = constructorFunction.body
    const assignments = block.body
      .filter((node) => {
        const { expression } = node
        return node.type === 'ExpressionStatement' &&
          expression.type === 'AssignmentExpression' &&
          expression.operator === '=' &&
          expression.left.type === 'MemberExpression' &&
          expression.left.object.type === 'ThisExpression'
      })

    assignments.forEach((assignment) => {
      const { name } = assignment.expression.left.property
      const info = { name }
      assignment.leadingComments.forEach((comment) => {
        const jsdoc = doctrine.parse(comment.value, { unwrap: true })
        jsdoc.tags.forEach((tag) => {
          if (tag.title === 'type') {
            info.nullable = tag.type.type !== 'NonNullableType'
            info.type = tag.type.name || tag.type.expression.name
            info.description = info.description || tag.description
          }
        })
      })
      data.attributes.push(info)
    })
  }
  return data
}

const scalarTypes = {
  string: GraphQLString,
  number: GraphQLFloat,
  int: GraphQLInt,
  float: GraphQLFloat,
  boolean: GraphQLBoolean,
  ID: GraphQLID
}

exports.createSchema = (...types) => {
  const graphQLTypes = {}
  let first = null
  const calculateType = (attr) => {
    let type = scalarTypes[attr.type] || graphQLTypes[attr.type]
    if (!type) return null
    type = attr.array ? new GraphQLList(type) : type
    return attr.nullable ? type : new GraphQLNonNull(type)
  }
  types.forEach((type) => {
    const metadata = exports.parse(type)
    const { name, description } = metadata
    const objectType = new GraphQLObjectType({
      name,
      description,
      fields: () => {
        const fields = {}
        metadata.attributes.forEach((attr) => {
          const { name, description } = attr
          const type = calculateType(attr)
          if (type) fields[name] = { type, description }
        })
        metadata.methods.forEach((attr) => {
          const { name, description } = attr
          const qlType = calculateType(attr.return)
          if (!qlType) return
          const args = {}
          attr.params.forEach((param) => {
            const { name } = param
            const type = calculateType(param)
            if (type) args[name] = { name, type }
          })
          fields[name] = {
            type: qlType,
            description,
            args,
            resolve (obj, args, context, ast) {
              const values = attr.params
                .map((param) => {
                  return param.type === 'context' ? context : args[param.name]
                })
              if (type[name]) {
                // static method
                return type[name].apply(null, values)
              } else {
                // instance method
                return type.prototype[name].apply(obj, values)
              }
            }
          }
        })
        return fields
      }
    })
    graphQLTypes[name] = objectType
    first = first || objectType
  })

  return new GraphQLSchema({ query: first })
}
