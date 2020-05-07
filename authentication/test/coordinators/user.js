const should = require('should');
const userCoordinator = require('../../coordinators/user');

const unitTestAccountObject = {
  storeId: '35408',
  firstName: 'nw',
  lastName: 'mply',
  userType: 'Store Manager',
  userId: 4,
};

const unitTestAccountObject1 = {
  storeId: '35408',
  firstName: 'nw',
  lastName: 'mply',
  userType: 'Store Manager',
  userId: 4,
  email: 'mw.mply@711.com',
  remoteUserId: 'npmly7002',
};

describe('Coordinators', () => {
  describe('user', () => {
    it('Should get userId for user', async () => {
      try {
        const { storeId, firstName, lastName, userType } = unitTestAccountObject;
        const userId = await userCoordinator.getUserId(storeId, firstName, lastName, userType);
        should(userId).equal(unitTestAccountObject.userId);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should create remoteUser', async () => {
      try {
        const { storeId, firstName, lastName, userType, userId, email, remoteUserId } = unitTestAccountObject1;
        const response = await userCoordinator.createRemoteUser(firstName, lastName, storeId, userId, remoteUserId, email, userType);
        const message = response.message;
        should(message).equals('User Created Successfully');
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should get storeUserId by storeId and remoteUserId', async () => {
      try {
        const { storeId, firstName, lastName, userType, userId, email, remoteUserId } = unitTestAccountObject1;
        const storeUserId = await userCoordinator.getStoreUserIdByStoreIdAndRemoteUserId(storeId, remoteUserId);
        should(storeUserId).equals(userId);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should authenticate user', async () => {
      try {
        const storeId = '35408';
        const userId = 40;
        const testPw = '711290';
        const result = await userCoordinator.loginUser(storeId, userId, testPw);
        should(result).equals(true);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should not authenticate user with incorrect password', async () => {
      try {
        const storeId = '35408';
        const userId = 40;
        const testPw = '71129000';
        const result = await userCoordinator.loginUser(storeId, userId, testPw);
        should(result).equals(false);
      } catch (error) {
        should.not.exists(error);
      }
    });
  });
});
