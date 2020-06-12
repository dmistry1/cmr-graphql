/**
 * Parse and return a lambda friendly response to errors
 * @param {Object} errorObj The error object that was thrown
 * @param {Boolean} shouldLog Whether or not to log the exceptions found
 */
export const parseError = (errorObj, {
  shouldLog = true,
  asJSON = true,
  reThrowError = false
} = {}) => {
  const {
    error,
    name = 'Error',
    statusCode = 500
  } = errorObj

  let errorArray = []

  if (error) {
    const { errors = ['Unknown Error'] } = error

    if (shouldLog) {
      // Log each error provided
      errors.forEach((message) => {
        console.log(`${name} (${statusCode}): ${message}`)
      })
    }

    errorArray = errors
  } else {
    if (shouldLog) {
      console.log(errorObj.toString())
    }

    errorArray = [errorObj.toString()]
  }

  // If the error needs to be thrown again, do so before returning
  if (reThrowError) {
    throw errorObj
  }

  if (asJSON) {
    return {
      statusCode,
      body: JSON.stringify({
        statusCode,
        errors: errorArray
      })
    }
  }

  return errorArray
}
