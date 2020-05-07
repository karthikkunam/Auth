const should = require('should');
const storeCoordinator = require('../../coordinators/store');

const unitTestAccount1 = {
  storeId: '35408',
  timeZone: 'CST',
  isActive: true,
  address: {
    streetAddress: '2021 S MAIN ST',
    city: 'KELLER',
    state: 'TX',
    zip: '76248',
    country: 'US',
    phone: 8177428000,
  },
};

describe('Coordinators', () => {
  describe('store', () => {
    it('Should get store info', async () => {
      try {
        const { storeId, address } = unitTestAccount1;
        const { streetAddress, city, state, zip, country, phone } = address;
        const storeInfoArray = await storeCoordinator.getStoreInfo(storeId);
        storeInfoArray.should.be.an.instanceOf(Array).and.have.lengthOf(1);
        const storeInfo = storeInfoArray[0];
        storeInfo.should.be.an.instanceOf(Object);
        should(storeInfo).have.property('storeId', storeId);
        const storeAddress = storeInfo.address;
        should(storeAddress).have.property('streetAddress', streetAddress);
        should(storeAddress).have.property('city', city);
        should(storeAddress).have.property('state', state);
        should(storeAddress).have.property('zip', zip);
        should(storeAddress).have.property('country', country);
        should(storeAddress).have.property('phone', phone);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should get empty object for store info', async () => {
      try {
        const randomIncorrectStoreId = '5655';
        const storeInfoArray = await storeCoordinator.getStoreInfo(randomIncorrectStoreId);
        should.exists(storeInfoArray);
        storeInfoArray.should.be.an.instanceOf(Array).and.have.lengthOf(1);
        const storeInfo = storeInfoArray[0];
        storeInfo.should.be.an.Object();
      } catch (error) {
        should.not.exists(error);
      }
    });

    // NOTE: You should have access to AWS credentials loaded for this to pass
    it('Should return false if storeId is not an allowed store for promo', async () => {
      try {
        const storeId = '00000';
        const isAllowedStore = await storeCoordinator.isAllowedStore(storeId);
        const isPromoEnabled = isAllowedStore.isPromoEnabled;
        should(isPromoEnabled).equal(false);
      } catch (error) {
        should.not.exists(error);
      }
    });

    it('Should return true if storeId is an allowed store for promo', async () => {
      try {
        const isAllowedStore = await storeCoordinator.isAllowedStore(unitTestAccount1.storeId);
        const isPromoEnabled = isAllowedStore.isPromoEnabled;
        should(isPromoEnabled).equal(true);
      } catch (error) {
        should.not.exists(error);
      }
    });
  });
});
