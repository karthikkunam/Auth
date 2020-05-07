import { GET, POST, STORE_PROFILE_SERVICE, BFF_SERVICE, STORE_USERS_SERVICE } from '../util/constants/auth';
import { Logger } from '@7eleven/7boss-logger';

const request = require('request');

class BaseService {
  getHeaders(service) {
    let headers;
    if (service === BFF_SERVICE) {
      headers = { 'content-type': 'application/json' };
    }
    if (service === STORE_PROFILE_SERVICE) {
      headers = {
        'content-type': 'application/json',
        'x-api-key': process.env.STORE_PROFILE_API_KEY,
      };
    }
    if (service === STORE_USERS_SERVICE) {
      headers = {
        'content-type': 'application/json',
        'x-api-key': process.env.STORE_USERS_API_KEY,
      };
    }
    return headers;
  }

  getURL(service, urlString) {
    let url;
    if (service === BFF_SERVICE) {
      url = process.env.bff_base_url + urlString;
    }
    if (service === STORE_PROFILE_SERVICE) {
      url = process.env.STORE_PROFILE_API + urlString;
    }
    if (service === STORE_USERS_SERVICE) {
      url = process.env.STORE_USERS_API + urlString;
    }
    return url;
  }

  getOptions(service, urlString, method, data = null) {
    const url = this.getURL(service, urlString);
    const body = data ? JSON.stringify(data) : null;
    const headers = this.getHeaders(service);
    const options = {
      url: url,
      method: method,
      body: body,
      headers: headers,
    };
    return options;
  }

  httpGet(service, url) {
    return this.call(service, url, GET);
  }

  httpPost(service, url, data) {
    return this.call(service, url, POST, data);
  }

  call(service, urlString, method, data = null) {
    const options = this.getOptions(service, urlString, method, data);
    return new Promise((resolve, reject) => {
      request(options, (err, response, body) => {
        if (err) {
          reject(err);
        } else if (response.statusCode !== 200 && response.statusCode !== 201 && response.statusCode !== 204) {
          resolve({
            code: response.statusCode,
            message: JSON.parse(response.body),
          });
        } else {
          body ? resolve(JSON.parse(body)) : resolve(body);
        }
      });
    });
  }
}

export { BaseService };
