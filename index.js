const _ = require('lodash');
const CreateQueryGenerator = require('./lib/CreateQueryGenerator');
const { DatabaseAdapter } = require('@restservicelanguage/database');
const ListDataTransformator = require('./lib/ListDataTransformator');
const ListQueryGenerator = require('./lib/ListQueryGenerator');
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

  async list({ type, filters = [], expands = [], limit = 100, offset = 0 }) {
    expands = _(expands)
      .map((expand) => _.find(type.properties, { name: expand }))
      .compact()
      .filter((expand) => {
        const expandType = _.isArray(expand.type) ? expand.type[0] : expand.type;
        return expandType.constructor.name === 'Type';
      })
      .value();

    const queryGenerator = new ListQueryGenerator({
      type,
      filters,
      expands,
      limit,
      offset
    });

    const query = queryGenerator.generateListQuery()
    this.log(query);

    const transformator = new ListDataTransformator({
      type,
      expands
    });

    const client = await this._getConnection();
    try {
      const result = await client.query(query);
      return transformator.transformData(result.rows);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      client.release();
    }
  }

  async insert({ type, data }) {
    const queryGenerator = new CreateQueryGenerator({
      type,
      data
    });

    const query = queryGenerator.generateCreateQuery();
    this.log(query);

    let id;
    await this._inTransaction(async function(client) {
      const result = await client.query(query)
      id = result.rows[0].id;

      const arrayQueries = queryGenerator.generateArrayQueries({ id });
      const arrayPromises = _.map(arrayQueries, (arrayQuery) => {
        this.log(arrayQuery);
        return client.query(arrayQuery);
      });
      await Promise.all(arrayPromises);
    });

    return [id];
  }

  async update(parameters) {
  }

  async remove(parameters) {
  }

  async _inTransaction(exec) {
    const client = await this._getConnection();
    try {
      await client.query('BEGIN');
      await exec.bind(this)(client);
      await client.query('COMMIT');
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
