const should = require('should');
const remoteCoordinator = require('../../coordinators/remote');

const unitTestAccountObject = {
  username: 'sajumpcloud3@711.com',
  deviceType: '35408',
  adGroups: {
    storeManagerGroup: ['35408', '18473', '36364', '37067', '35408', '37067', '35408', '36364', '35408', '35378', '35408', '1991'],
    otherADGroups: [],
  },
};

const testAccount1 = {
  name_id: 'tstfo001',
  storeId: '35408',
  userId: 40,
  attributes: {
    Role: [
      'CN=portal-sp-tech-appcat-TEST-owners,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=Portal-SP-Stores-NonEmployee-Visitor,OU=Application,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=Portal-SP-NonStore-NonEmployee-Visitor,OU=Application,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=Store Manager 35408,OU=MKT-02811,OU=DIV-72829,OU=Stores,DC=7-11,DC=com',
      'CN=Store Manager 18473,OU=MKT-02811,OU=DIV-72829,OU=Stores,DC=7-11,DC=com',
      'CN=Store Manager 36364,OU=MKT-02811,OU=DIV-72829,OU=Stores,DC=7-11,DC=com',
      'CN=nointernet-send,OU=Application,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=NAC-REMOTE-STR-7RPT-TEST,OU=VPN Access,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=NAC-REMOTE-STR-7RPT-USR,OU=VPN Access,OU=User Groups,OU=Corp,DC=7-11,DC=com',
      'CN=All email except Canada,OU=Email Distribution,OU=User Groups,OU=Corp,DC=7-11,DC=com',
    ],
    firstName: 'T',
    lastName: 'stfo',
    email: 'Tstfo@711.com',
    UserType: 'Franchise Owner',
  },
};

const testStoreManagerADGroup = {
  storeManagerGroup: [
    '19136',
    '18553',
    '18473',
    '19570',
    '11282',
    '11731',
    '17114',
    '17534',
    '19903',
    '13026',
    '23242',
    '23976',
    '22979',
    '26825',
    '35337',
    '36765',
    '37126',
    '32932',
    '33126',
    '34556',
    '36999',
    '36312',
    '33294',
    '34154',
    '35554',
    '34990',
    '36364',
    '35968',
    '35321',
    '12345',
    '34120',
    '35378',
    '37067',
    '35408',
    '19136',
  ],
  franchiseOwnerGroup: [],
  otherADGroups: [],
};

describe('Coordinators', () => {
  describe('remote', () => {
    it('Should not login user with incorrect credentials', async () => {
      try {
        const { firstName, lastName, name_id, UserType, email, storeId, userId } = testAccount1;
        const testPw = '71129000';
        const feature = 'ordering';
        const isLoginSuccess = await remoteCoordinator.login(firstName, lastName, name_id, email, storeId, userId, testPw, feature, UserType);
        should(isLoginSuccess).equals(false);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should get allowedStores from storeManager Group', async () => {
      try {
        const allowedStores = await remoteCoordinator.getAllowedStores(testStoreManagerADGroup);
        allowedStores.should.be.an.instanceOf(Array).and.have.lengthOf(26);
        should(allowedStores[0]).have.property('storeId', '11282');
      } catch (error) {
        should.not.exists(error);
      }
    });
  });
});
