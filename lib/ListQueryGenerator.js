const _ = require('lodash');

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

  get _arrayFields() {
    return _(this._type.properties)
      .filter((property) => _.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  generateListQuery() {
    const innerQuery = this._innerQuery();
    const arrayQuery = this._arrayDataQuery();

    const select = ['main.*', arrayQuery.select].join(', ');

    const fullQuery = `SELECT ${select} FROM (${innerQuery}) as main ${arrayQuery.join};`;
    return {
      text: fullQuery,
      values: [this._limit, this._offset]
    };
  }

  _innerQuery() {
    return `SELECT * FROM "${this._type.name}" LIMIT $1 OFFSET $2`;
  }

  _arrayDataQuery() {
    const join = _(this._arrayFields)
      .map((arrayField) => {
        return `LEFT OUTER JOIN "${this._type.name}_${arrayField}" as "t${arrayField}" ON main.id = "t${arrayField}"."${this._type.name}"`;
      })
      .join(' ');

    const select = _(this._arrayFields)
      .map((arrayField) => `"t${arrayField}".value as "${arrayField}"`)
      .join(', ');

    return {
      join,
      select
    };
  }

};