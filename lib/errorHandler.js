const { UnknownError, ConstraintError } = require('@restservicelanguage/database');

module.exports = function handleError(error) {
  
  if (error.code === '23503') {
    throw new ConstraintError(error.table);
  }

  if (error.code === '23505') {
    throw new ConstraintError(error.constraint);
  }

  console.error(error);
  throw new UnknownError();
};
