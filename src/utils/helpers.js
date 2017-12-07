const checkRequired = (val) => {
  if (val === undefined || val === null) {
    return false;
  }
  const str = String(val).replace(/\s/g, '');
  return str.length > 0;
};

const validateRequired = (obj) => {
  const validateMessages = {};
  let passes = true;
  Object.keys(obj).forEach((key) => {
    if (!checkRequired(obj[key])) {
      validateMessages[key] = `The ${key} field is required`;
    }
  });

  if (Object.keys(validateMessages).length > 0) {
    passes = false;
    return { passes, validateMessages };
  }
  return { passes };
};

export default validateRequired;
