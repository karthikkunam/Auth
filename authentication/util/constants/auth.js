const TOKEN = 'token';
const IV = 'Jo302KLRxdOVjMOPU7it4w==';
const ALGORITHM = 'aes-256-cbc';
const DECRYPT_KEY = 'bPeShVmYq3t6w9z$C&F)H@McQfTjWnZr';
const IP_PATTERN = /^(10)\.([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.([0-9]|[1-8][0-9]|9[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.(10)$/;
const ISP = 'ISP';
const PRODUCTION = 'production';
const BFF_SERVICE = 'bff';
const STORE_PROFILE_SERVICE = 'storeProfile';
const STORE_USERS_SERVICE = 'storeUsers';
const REMOTE_USER_SERVICE = 'remoteUser';
const ISP_USER_ACCESS_ID_SESSION_EXPIRY_TIME = 1800;
const SIGN_OPTIONS = {
  expiresIn: 15 * 60,
  algorithm: 'RS256',
};
const DEV_BFF_URL = 'http://storesytemservice.ris-dev.7-eleven.com'; // UPDATED DEV BFF URL
const ACCESS_TOKEN_EXPIRY = 240;
const GET = 'GET';
const POST = 'POST';
const AUTHORIZATION = 'authorization';

export {
  BFF_SERVICE,
  STORE_PROFILE_SERVICE,
  STORE_USERS_SERVICE,
  REMOTE_USER_SERVICE,
  TOKEN,
  IV,
  ALGORITHM,
  DECRYPT_KEY,
  IP_PATTERN,
  ISP,
  PRODUCTION,
  SIGN_OPTIONS,
  DEV_BFF_URL,
  ACCESS_TOKEN_EXPIRY,
  GET,
  POST,
  AUTHORIZATION,
  ISP_USER_ACCESS_ID_SESSION_EXPIRY_TIME,
};
