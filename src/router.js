const controllers = require('./controllers');
// const mid = require('./middleware');

const router = (app) => {
  // universal
  app.get('/*', controllers.gamePage);
};

module.exports = router;
