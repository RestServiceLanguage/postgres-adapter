const _ = require('lodash');

module.exports = class MutationQueryGenerator {

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

  get _arrayColumns() {
    return _(this._type.properties)
      .filter((property) => _.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  escapeColumns(columns) {
    return _.map(columns, (column) => `"${column}"`);
  }

  generateArrayQueries({ id }) {
    const arrayData = _.omit(this._data, ...this._nonArrayColumns);
    const arrayQueries = _(arrayData)
      .keys()
      .filter((key) => arrayData[key].length > 0)
      .map((key) => {
        const valueQuery = this._generateArrayValues({
          id,
          values: arrayData[key]
        });

        return {
          text: `INSERT INTO "${this._type.name}_${key}"("${this._type.name}", value) VALUES ${valueQuery.text}`,
          values: valueQuery.values
        };
      })
      .value();
    
    return arrayQueries;
  }

  _generateArrayValues({ id, values }) {
    const valueTexts = [];
    const queryValues = [id];
    for (let i = 0; i < values.length; ++i) {
      valueTexts.push(`($1, $${i + 2})`);
      queryValues.push(values[i]);
    }

    return {
      text: valueTexts.join(', '),
      values: queryValues
    };
  };

};