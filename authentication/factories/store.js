const moment = require('moment');
const appPackage = require('../package.json');
const { REMOTE_USER_DEVICE_TYPE } = require('../util/constants/remote');

// NOTE: payload example
// {
//     "userId": 41,
//     "storeId": "18473",
//     "deviceType": "ISP",
//     "feature": "ordering",
//     "ip": "192.168.137.29",
//     "readOnly": false,
//     "dateTime": "2020-03-17T23:40:53Z",
//     "timeStamp": "1584488453",
//     "store": {
//     "storeId": "18473",
//         "isOrderBatchRunning": false,
//         "isSystemAvailable": true,
//         "timeZone": "CST",
//         "recalculatedOn": "2020-03-17T15:02:01.179Z",
//         "features": {
//         "boss": {
//             "isInventoryEngineEnabled": true,
//                 "isOrderingEnabled": true,
//                 "isPromoParticipationEnabled": true
//         },
//         "store": {
//             "isGRNonDaily": true,
//                 "isGRAIForecast": true,
//                 "isGRAutoApprove": true,
//                 "is3rdPartyGasWorksheetEnabled": false,
//                 "isAcessBoHHistoryFromQoIActive": true,
//                 "isCalcMinimumOnhandAutoApplyEnabled": true,
//                 "isElectronicCheckinEnabled": true,
//                 "isGRSingleDayEnabled": false,
//                 "isItemRestrictionDisabled": false,
//                 "isNonSelfBillingEnabled": true,
//                 "isRestrictedAlcohalSalesHoursEnabled": false,
//                 "isSupplyBudgetTrackingEnabled": true,
//                 "isWriteoffBudgetTrackingEnabled": true
//         }
//     },
//     "user": {
//         "userId": 41,
//             "fullName": "tffny tylr",
//             "roles": [
//             "POS 4 END OF DAY SIGN ON",
//             "Store Associate"
//         ]
//     }
// },
//     "app": {
//     "environment": "local",
//         "version": "1.0.7-beta"
// },
//     "iat": 1584488457,
//     "exp": 1584489357
// }

async function buildRemoteUserPayload(storeId, userId, firstName, lastName, username, email, userType, storeProfile, userProfile, feature) {
  const userRoles = userProfile.roles;
  try {
    if (!feature) {
      feature = 'ordering';
    }
    logger.info(
      `Building user with storeId ${storeId} firstName ${firstName} lastName ${lastName} username ${username} email ${email} userType ${userType}`
    );
    let utcValue = moment.utc().valueOf().toString();
    let currentUtcTime = parseInt(utcValue.slice(0, -3));
    const store = { ...storeProfile };
    const userProfile = {
      userId: userId,
      fullName: firstName + ' ' + lastName,
      roles: userRoles,
    };
    const readOnlyView = userId === 40 ? true : false;
    const user = {
      userId: userId,
      storeId: storeId,
      deviceType: REMOTE_USER_DEVICE_TYPE,
      feature: feature,
      readOnly: readOnlyView,
      dateTime: `${moment.utc().format()}`,
      timeStamp: `${currentUtcTime}`,
      store: {
        ...store,
        user: process.env.ENVIRONMENT !== 'prod' ? { ...userProfile } : {},
      },
      app: {
        environment: 'qa',
        version: '1.0.7-beta',
      },
    };
    logger.info(`Built user ${JSON.stringify(user)}`);
    return user;
  } catch (error) {
    logger.error(
      error,
      `Error building user with storeId ${storeId} firstName ${firstName} lastName ${lastName} username ${username} email ${email} userType ${userType}`
    );
    throw error;
  }
}

module.exports = {
  buildRemoteUserPayload,
};
