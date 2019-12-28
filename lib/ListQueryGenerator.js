const _ = require('lodash');

const filterRegex = /^([^<>=]+)(<|>|=|<=|>=)([^<>=]+)$/m;
function getFilterParameters(filter) {
  if (filterRegex.test(filter)) {
    const match = filter.match(filterRegex);
    return {
      name: match[1],
      operation: match[2],
      value: match[3]
    };
  }
}

module.exports = class ListQueryGenerator {

  constructor({
    type,
    filters,
    expands,
    limit,
    offset
  }) {
    this._type = type;
    this._filters = _(filters)
      .map((filter) => getFilterParameters(filter))
      .filter((filter) => {
        const property = _.find(type.property, { name: filter.name });
        return !_.isUndefined(property) && !_.isArray(property.type);
      })
      .value();
    this._expands = expands;
    this._limit = limit;
    this._offset = offset;
  }

  get _arrayFields() {
    return _(this._type.properties)
      .filter((property) => _.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  generateListQuery() {
    const innerQuery = this._innerQuery();
    const arrayQuery = this._arrayDataQuery();
    const expandsQuery = this._expandsQuery();
    const filterQuery = this._filterQuery();

    const select = _(['main.*', arrayQuery.select, expandsQuery.select]).filter((e) => !_.isEmpty(e)).join(', ');

    const fullQuery = `SELECT ${select} FROM (${innerQuery}) as main ${arrayQuery.join} ${expandsQuery.join} ${filterQuery.text};`;
    return {
      text: fullQuery,
      values: [this._limit, this._offset, ...filterQuery.values]
    };
  }

  _innerQuery() {
    return `SELECT * FROM "${this._type.name}" LIMIT $1 OFFSET $2`;
  }

  _arrayDataQuery() {
    const join = _(this._arrayFields)
      .map((arrayField) => {
        return `LEFT OUTER JOIN "${this._type.name}_${arrayField}" as "t${arrayField}" ON main.id = "t${arrayField}"."${this._type.name}"`;
      })
      .join(' ');

    const select = _(this._arrayFields)
      .map((arrayField) => `"t${arrayField}".value as "${arrayField}"`)
      .join(', ');

    return {
      join,
      select
    };
  }

  _filterQuery() {
    if (this._filters.length > 0) {
      const text = `WHERE ` + _(this._filters)
        .map((filter, index) => `"main"."${filter.name}" ${filter.operation} $${index + 3}`)
        .join(' AND ');

      const values = _.map(this._filters, (filter) => filter.value);

      return {
        text,
        values
      };
    } else {
      return {
        text: '',
        values: []
      };
    }
  }

  _expandsQuery() {
    const join = _(this._expands)
      .map((expand) => {
        if (_.isArray(expand.type)) {
          return `LEFT OUTER JOIN "${expand.type[0].name}" as "j${expand.name}" ON "j${expand.name}".id = "t${expand.name}".value`;
        } else {
          return `LEFT OUTER JOIN "${expand.type.name}" as "j${expand.name}" ON "j${expand.name}".id = "${this._type.name}".${expand.name}`;
        }
      })
      .join(' ');

    const select = _(this._expands)
      .flatMap((expand) => {
        const expandType = _.isArray(expand.type) ? expand.type[0] : expand.type;

        const fields = _.map(
          expandType.properties,
          (property) => `"j${expand.name}"."${property.name}" as "${expand.name}_${property.name}"`
        );

        return fields;
      })
      .join(', ');

    return {
      join,
      select
    };
  }

};