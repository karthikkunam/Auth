require('dotenv').config();
const { _initializeLogger } = require('../logger');

before((done) => {
  _initializeLogger().then(() => {
    console.log('Logger initialized');
  });
  done();
});
