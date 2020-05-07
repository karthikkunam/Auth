const { STOR_APP_PRODSUP, STOR_MANAGER_GROUP } = require('../../../util/constants/remote');
const should = require('should');
const request = require('supertest');
const { app } = require('../../../server');
const UNAUTHORIZED_MESSAGE = 'Unauthorized';

const server = app;

const unitTestAccountObject = {
  username: 'sridhar@711.com',
  storeId: '35408',
};

// NOTE: RUN THE PYTON SCRIPT TO ESTABLISH ACCESS TO AWS
describe('controllers', () => {
  describe('remote', () => {
    it('Should get allowed features for store', async () => {
      try {
        const response = await request(server).get(
          `/7boss/remote/store/${unitTestAccountObject.storeId}/${unitTestAccountObject.username}/${STOR_APP_PRODSUP}`
        );
        should(response).have.property('status', 200);
        const isAllowedStore = response.body;
        should.exist(isAllowedStore);
        isAllowedStore.should.be.an.instanceOf(Object);
        should(isAllowedStore).have.property('isOrderingEnabled', true);
        should(isAllowedStore).have.property('isPromoEnabled', false);
        should(isAllowedStore).have.property('isInventoryEnabled', false);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should return error for user with adGroup other than STOR_APP_PRODSUP', async () => {
      try {
        const response = await request(server).get(
          `/7boss/remote/store/${unitTestAccountObject.storeId}/${unitTestAccountObject.username}/${STOR_MANAGER_GROUP}`
        );
        const responseBody = response.body;
        should(response).have.property('status', 401);
        should(responseBody).have.property('message', UNAUTHORIZED_MESSAGE);
      } catch (error) {
        should.not.exists(error);
      }
    });
  });
});
