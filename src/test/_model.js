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

exports.Comment = Comment
exports.Query = Query
