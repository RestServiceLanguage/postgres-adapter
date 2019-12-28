const _ = require('lodash');
const MutationQueryGenerator = require('./MutationQueryGenerator');

module.exports = class UpdateQueryGenerator extends MutationQueryGenerator {

  constructor({ id, type, data }) {
    super({ type, data });
    this._id = id;
  }

  generateUpdateQuery() {
    const nonArrayData = _.pick(this._data, ...this._nonArrayColumns);
    const valueQuery = this._generateValues(nonArrayData);

    return {
      text: `UPDATE "${this._type.name}" SET ${valueQuery.text} WHERE "id" = $1;`,
      values: [this._id, ...valueQuery.values]
    };
  }

  generateArrayQueries() {
    return super.generateArrayQueries({ id: this._id });
  }

  _generateValues(data) {
    data.id = this._id;
    const columns = _.keys(data);
    const text = _(columns)
      .map((column, index) => `${column} = $${index + 2}`)
      .join(', ');

    return {
      text,
      values: _.map(columns, (column) => data[column])
    };
  }

};