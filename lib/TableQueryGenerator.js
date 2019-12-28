const _ = require('lodash');
const { typeMapping } = require('./util');

module.exports = class TableQueryGenerator {

  constructor({ type }) {
    this._type = type;
  }

  generateBaseQuery() {
    const columns = _.filter(this._type.properties, (property) => !_.isArray(property.type));

    const columnQuery = _.map(columns, (column) => {
      const customType = _.isNil(typeMapping[column.type]);

      const type = customType ? 'INTEGER' : typeMapping[column.type];
      let query = `${column.name} ${type}`;

      if (column.uniq) {
        query += ' UNIQUE';
      }

      if (!column.nullable) {
        query += ' NOT NULL';
      }

      if (customType) {
        query += `REFERENCES ${column.type.name}(id)`;
      }

      return query;
    });

    const baseTableQuery = `CREATE TABLE IF NOT EXISTS "${this._type.name}" (${['id SERIAL PRIMARY KEY', ...columnQuery].join(', ')});`;
    return baseTableQuery;
  }

  generateArrayQueries() {
    const arrayTables = _.filter(this._type.properties, (property) => _.isArray(property.type));
    const arrayQueries = _.map(arrayTables, function(property) {
      return this._generateArrayTableQuery(property);
    }.bind(this));
    return arrayQueries;
  }

  _generateArrayTableQuery(property) {
    const type = property.type[0];

    const customType = _.isNil(typeMapping[type]);
    const tableName = `${this._type.name}_${property.name}`;
    
    const valueType = customType ? 'INTEGER' : typeMapping[type];
    const refValue = customType ? `REFERENCES "${type.name}"(id)` : ''; 

    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY, "${this._type.name}" INTEGER REFERENCES "${this._type.name}"(id), value ${valueType} ${refValue});`;

    return query;
  }

};