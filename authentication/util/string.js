export const encode = (value) => {
  try {
    return Buffer.from(value).toString('base64');
  } catch (exception) {
    throw exception;
  }
};

export const decode = (value) => {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString());
  } catch (exception) {
    throw exception;
  }
};

export const clean = (value) => {
  try {
    return value ? value : '';
  } catch (exception) {
    return '';
  }
};
