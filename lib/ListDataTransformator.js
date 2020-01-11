const _ = require('lodash');
const { typeMapping } = require('./util');

module.exports = class ListDataTransformator {

  constructor({ type, expands, orderBy }) {
    this._type = type;
    this._expands = expands;
    this._orderBy = orderBy;
  }

  get _arrayFields() {
    return _(this._type.properties)
      .filter((property) => _.isArray(property.type))
      .map((property) => property.name)
      .value();
  }

  transformData(data) {
    const mergedArrayData = _.map(data, (datum) => {
      for (const arrayField of this._arrayFields) {
        datum[arrayField] = {
          _id: datum[`${arrayField}_int_id`],
          value: datum[arrayField]
        };
      }

      return datum;
    });

    const groupedData = _.groupBy(mergedArrayData, 'id');

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
                  ..._.omit(datum, ...fullFieldNames),
                  [expand.name]: _.reduce(
                    fields,
                    (acc, field, index) => ({
                      ...acc,
                      [field]: datum[fullFieldNames[index]],
                      _id: datum[`${expand.name}_int_id`]
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

          const isExpand = !_.isUndefined(_.find(this._expands, (expand) => expand.name === property.name));

          if (_.isUndefined(typeMapping[property.type]) && isExpand) {
            return _(dataArray).filter((el) => !_.isNil(el)).uniqBy('id').value();
          } else {
            return _.compact(dataArray);
          }
        }
        return input;
      })
    );

    const cleanedArrayData = _.map(mergedData, (data) => {
      for (const arrayField of this._arrayFields) {
        const isExpand = !_.isUndefined(_.find(this._expands, (expand) => expand.name === arrayField));

        data[arrayField] = _(data[arrayField])
          .uniqBy('_id')
          .map((datum) => _.omit(datum, '_id'))
          .map((datum) => isExpand ? datum : datum.value)
          .filter((datum) => isExpand ? !_.isNil(datum.id) : !_.isNil(datum))
          .value();

        data = _.omit(data, `${arrayField}_int_id`);
      }

      return data;
    });

    return _.sortBy(cleanedArrayData, this._orderBy);
  }
};
