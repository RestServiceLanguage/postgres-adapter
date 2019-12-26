const { DatabaseAdapter } = require('@restservicelanguage/database');
const pg = require('pg');

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
      await exec(client);
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
