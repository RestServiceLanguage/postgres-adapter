const { UnknownError } = require('@restservicelanguage/database');

module.exports = function handleError(error) {
  console.error(error);
  return new UnknownError();
};
