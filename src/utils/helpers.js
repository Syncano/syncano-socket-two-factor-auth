/* eslint no-throw-literal: 0 */
const checkRequired = (val) => {
  if (val === undefined || val === null) {
    return false;
  }
  const str = String(val).replace(/\s/g, '');
  return str.length > 0;
};

const validateRequired = (obj, customMessage = 'Validation error(s)', statusCode = 400) => {
  const validateMessages = {};
  Object.keys(obj).forEach((key) => {
    if (!checkRequired(obj[key])) {
      validateMessages[key] = `The ${key} field is required`;
    }
  });

  if (Object.keys(validateMessages).length > 0) {
    throw ({ customMessage, details: validateMessages, statusCode });
  }
};

export default validateRequired;
