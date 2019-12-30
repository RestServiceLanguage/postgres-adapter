const _ = require('lodash');
const MutationQueryGenerator = require('./MutationQueryGenerator');

module.exports = class CreateQueryGenerator extends MutationQueryGenerator {

  constructor({ type, data }) {
    super({ type, data });
  }

  generateCreateQuery() {
    const nonArrayData = _.pick(this._data, ...this._nonArrayColumns);
    const valueQuery = this._generateValues(nonArrayData);

    const columnText = valueQuery.values.length === 0 ? '' : `(${escapeColumns(this._nonArrayColumns).join(', ')})`;

    return {
      text: `INSERT INTO "${this._type.name}"${columnText} VALUES (${valueQuery.text}) RETURNING id;`,
      values: valueQuery.values
    };
  }

  _generateValues(data) {
    const values = _.values(data);
    return {
      text: values.length === 0 ? 'default' : _(values).map((value, index) => `$${index + 1}`).join(', '),
      values
    }
  }
  
};