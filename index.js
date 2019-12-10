const errorHandler = require('./lib/errorHandler');
const { KnexAdapter } = require('@restservicelanguage/database');

module.exports = class PostgresAdapter extends KnexAdapter {

  constructor({ host, user, password, database }) {
    super({
      client: 'pg',
      connection: {
        host,
        user,
        password,
        database
      }
    });
  }

  async list(parameters) {
    try {
      return await super.list(parameters);
    } catch (e) {
      throw errorHandler(e);
    }
  }

  async insert(parameters) {
    try {
      return await super.insert(parameters);
    } catch (e) {
      throw errorHandler(e);
    }
  }

  async update(parameters) {
    try {
      return await super.update(parameters);
    } catch (e) {
      throw errorHandler(e);
    }
  }

  async remove(parameters) {
    try {
      return await super.remove(parameters);
    } catch (e) {
      throw errorHandler(e);
    }
  }

};
