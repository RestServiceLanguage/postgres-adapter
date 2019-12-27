const { DatabaseAdapter } = require('@restservicelanguage/database');
const pg = require('pg');
const TableQueryGenerator = require('./lib/TableQueryGenerator');

module.exports = class PostgresAdapter extends DatabaseAdapter {

  constructor({ host, user, password, database, port = 5432, log = false }) {
    super();
    this._pool = new pg.Pool({
      user,
      host,
      password,
      database,
      port
    });
    this._log = log;
  }

  log(...element) {
    if (this._log) {
      console.log(element);
    }
  }

  async _createTable(type) {
    const queryGenerator = new TableQueryGenerator({ type });
    
    const baseTableQuery = queryGenerator.generateBaseQuery();
    const arrayQueries = queryGenerator.generateArrayQueries();

    await this._inTransaction(async function(client) {
      this.log(baseTableQuery);
      await client.query(baseTableQuery);
      for (const arrayQuery of arrayQueries) {
        this.log(arrayQuery);
        await client.query(arrayQuery);
      }
    });
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
