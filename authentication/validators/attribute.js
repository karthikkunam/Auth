async function validateAttributes(storeId, firstName, lastName, username, email, userType, feature) {
  logger.info(
    `Validating if attributes storeId ${storeId} feature ${feature} firstName ${firstName} lastName ${lastName} username ${username} email ${email} userType ${userType} are valid`
  );
  let isValidated = true;
  if (!storeId || !username || !firstName || !lastName || !email) {
    logger.error(`Error required attributes: firstName, lastName, username, email, storeId`);
    isValidated = false;
  }
  logger.info(
    `Validated attributes storeId ${storeId} firstName ${firstName} lastName ${lastName} username ${username} email ${email} userType ${userType}`
  );
  return isValidated;
}

module.exports = {
  validateAttributes,
};
