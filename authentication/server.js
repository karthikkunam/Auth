const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { router } = require('./controllers/auth');
const { remoteRouter } = require('./controllers/remote');

const helmet = require('helmet');

// Initialize express
const app = express();

// Middlewares
app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(function (req, res, next) {
  //set headers to allow cross origin request.
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, accesstoken');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
  res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
  res.setHeader('Expires', '0'); // Proxies.
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Routers
app.use('/7boss/auth', router);
app.use('/7boss/promo', router);
app.use('/7boss/order', router);
app.use('/7boss/inventory', router);
app.use('/7boss/remote', remoteRouter);

app.get('/healthcheck', (req, res) => {
  res.status(200).send(true);
});

export { app };
