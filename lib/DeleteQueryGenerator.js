module.exports = class DeleteQueryGenerator {

  constructor({ type, id }) {
    this._type = type;
    this._id = id;
  }

  generateDeleteQuery() {
    return {
      text: `DELETE FROM "${this._type.name}" WHERE "id" = $1`,
      values: [this._id]
    };
  }

};