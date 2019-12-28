const _ = require('lodash');

module.exports = class ListDataTransformator {

  constructor({ type, expands }) {
    this._type = type;
    this._expands = _(expands)
      .map((expand) => _.find(type.properties, { name: expand }))
      .compact()
      .filter((expand) => expand.type.constructor.name === 'Type')
      .value();
  }

  get _arrayFields() {
    return _(this._type.properties)
      .filter((property) => _.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  transformData(data) {
    const groupedData = _.groupBy(data, 'id');

    const expandedData = _.reduce(
      this._expands,
      (acc, expand) => {
        const type = _.isArray(expand.type) ? expand.type[0] : expand.type;
        const fields = ['id', ..._.map(type.properties, (p) => p.name)];
        const fullFieldNames = _.map(
          fields,
          (field) => `${expand.name}_${field}`
        );

        return _(acc)
          .mapValues((dataset) => {
            const mappedData = _.map(dataset, (datum) => {
              if (_.isNil(datum[expand.name])) {
                return _.omit(datum, ...fullFieldNames);
              } else {
                return {
                  ..._.omit(datum, fullFieldNames),
                  [expand.name]: _.reduce(
                    fields,
                    (acc, field, index) => ({
                      ...acc,
                      [field]: datum[fullFieldNames[index]]
                    }),
                    {}
                  )
                };
              }
            });

            return mappedData;
          })
          .value();
      },
      groupedData
    );

    const datasets = _.values(expandedData);
    const type = this._type;
    const mergedData = _.map(datasets, (dataset) =>
      _.mergeWith({}, ...dataset, (output, input, field) => {
        const property = _.find(
          type.properties,
          (property) => property.name === field
        );

        if (_.isArray(_.get(property, 'type'))) {
          const dataArray = _.isNil(output) ? [input] : [...output, input];

          if (_.isUndefined(typeMapping[property.type])) {
            return _(dataArray).filter((el) => !_.isNil(el)).uniqBy('id').value();
          } else {
            return _.compact(dataArray);
          }
        }
        return input;
      })
    );

    return mergedData;
  }
};