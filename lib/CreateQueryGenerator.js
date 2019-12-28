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

    const columnText = valueQuery.values.length === 0 ? '' : `(${this._nonArrayColumns.join(', ')})`;

    return {
      text: `INSERT INTO "${this._type.name}"${columnText} VALUES (${valueQuery.text}) RETURNING id;`,
      values: valueQuery.values
    };
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

  _generateValues(data) {
    const values = _.values(data);
    return {
      text: values.length === 0 ? 'default' : _(values).map((value, index) => `$${index + 1}`).join(', '),
      values
    }
  }

  _generateArrayValues({ id, values }) {
    const valueTexts = [];
    const queryValues = [];
    for (let i = 0; i < values.length; ++i) {
      valueTexts.push(`($${2 * i + 1}), $${2 * i + 2})`);
      queryValues.push(id, values[i]);
    }

    return {
      text: valueTexts.join(', '),
      values: queryValues
    };
  };

};