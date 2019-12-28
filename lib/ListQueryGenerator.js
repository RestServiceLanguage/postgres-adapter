module.exports = class ListQueryGenerator {

  constructor({
    type,
    filters,
    expands,
    limit,
    offset
  }) {
    this._type = type;
    this._filters = filters;
    this._expands = expands;
    this._limit = limit;
    this._offset = offset;
  }

  generateListQuery() {
    const fullQuery = `${this._innerQuery()}`;
    return {
      text: fullQuery,
      values: [this._limit, this._offset]
    };
  }

  _innerQuery() {
    return `SELECT * FROM "${this._type.name}" LIMIT $1 OFFSET $2;`;
  }

};