const _ = require('lodash');

module.exports = class CreateQueryGenerator {

  constructor({ type, data }) {
    this._type = type;
    this._data = _.pick(data, ...this._columns);
  }

  get _columns() {
    return _.map(this._type.properties, (property) => property.name);
  }

  get _nonArrayColumns() {
    return _(this._type.properties)
      .filter((property) => !_.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  generateCreateQuery() {
    const nonArrayData = _.pick(this._data, ...this._nonArrayColumns);
    const valueQuery = this._generateValues(nonArrayData);

    return {
      text: `INSERT INTO "${this._type.name}"(${this._nonArrayColumns.join(', ')}) VALUES (${valueQuery.text}) RETURNING id;`,
      values: valueQuery.values
    };
  }

  _generateValues(data) {
    const values = _.values(data);
    return {
      text: _(values).map((value, index) => `$${index + 1}`).join(', '),
      values
    }
  }

};