const _ = require('lodash');
const { DatabaseAdapter } = require('@restservicelanguage/database');
const pg = require('pg');

const typeMapping = {
  'Integer': 'INTEGER',
  'String': 'VARCHAR(255)',
  'Text': 'TEXT',
  'Date': 'DATE',
  'Float': 'DOUBLE PRECISION',
  'Boolean': 'BOOLEAN'
};

module.exports = class PostgresAdapter extends DatabaseAdapter {

  constructor({ host, user, password, database, port }) {
    super();
    this._pool = new pg.Pool({
      user,
      host,
      password,
      database,
      port
    });
  }

  async _createTable(type) {
    const columns = _.filter(type.properties, (property) => !_.isArray(property.type));
    const arrayTables = _.filter(type.properties, (property) => _.isArray(property.type));

    const columnQuery = _(columns)
      .map((column) => {
        const customType = _.isNil(typeMapping[column.type]);

        const type = customType ? 'INTEGER' : '';
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
      })
      .join(', ');

    const baseTableQuery = `CREATE TABLE "${type.name}" (${['id SERIAL PRIMARY KEY', ...columnQuery].join(', ')});`;
    const arrayQueries = _.map(arrayTables, (property) => this._createArrayTableQuery({ type, property }));

    await this._inTransaction(async function(client) {
      await client.query(baseTableQuery);
      for (const arrayQuery of arrayQueries) {
        await client.query(arrayQuery);
      }
    });
  }

  _createArrayTableQuery({ type, property }) {
    const customType = _.isNil(typeMapping[property.type]);
    const tableName = `${type.name}_${property.name}`;

    const valueType = customType ? 'INTEGER' : typeMapping[property.type];

    const query = `CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY, "${type.name}" INTEGER REFERENCES "${type.name}"(id), value ${valueType});`;

    return query;
  }

  async list(parameters) {
  }

  async insert(parameters) {
  }

  async update(parameters) {
  }

  async remove(parameters) {
  }

  async _inTransaction(exec) {
    const client = await this._getConnection();
    try {
      await exec.bind(this)(client);
    } catch (e) {
      console.error(e);
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async _getConnection() {
    return await this._pool.connect();
  }

};
