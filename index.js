const errorHandler = require('./lib/errorHandler');
const { DatabaseAdapter } = require('@restservicelanguage/database');
const pg = require('pg');

module.exports = class PostgresAdapter extends DatabaseAdapter {

  constructor({ host, user, password, database, port }) {
    super();
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

};
