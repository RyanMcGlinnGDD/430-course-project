// import libraries
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const url = require('url');
const csrf = require('csurf');
const websocketServer = require('./server');

const dbURL = process.env.MONGODB_URI || 'mongodb://heroku_83k4fgn4:1h69mgma5ov2o51oe20f2bvbj7@ds119618.mlab.com:19618/heroku_83k4fgn4';

mongoose.connect(dbURL, (err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

let redisURL = {
  hostname: 'localhost',
  port: 6379,
};

let redisPASS;
if (process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(':')[1];
}

// pull in our routes
const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;


const app = express();
app.use('/assets', express.static(path.resolve(`${__dirname}/../client/`)));
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(session({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS,
  }),
  secret: 'All Your Base',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
}));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.use(favicon(`${__dirname}/../client/img/favicon.png`));
app.disable('x-powered-by');
app.use(cookieParser());

// csrf comes after cookieParser/session but before router(app)
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  console.log('missing CSRF token');
  return false;
});

router(app);

const server = app.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});


websocketServer(server);
