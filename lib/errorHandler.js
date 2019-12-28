const { UnknownError, ConstraintError } = require('@restservicelanguage/database');

module.exports = function handleError(error) {
  
  if (error.code === '23503') {
    throw new ConstraintError(error.table);
  }

  console.error(error);
  throw new UnknownError();
};
