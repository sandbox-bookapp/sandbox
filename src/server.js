'use strict';

const express = require('express');

const notFoundHandler = require('./error-handlers/404.js');
const errorHandler = require('./error-handlers/500.js');
const logger = require('./middleware/logger.js');

// const v1Routes = require('./auth/routes/v1');
const v2Routes = require('./auth/routes/v2');
const authRoutes = require('./auth/routes.js');

// new dependencies
const methodOverride = require('method-override');
// const superagent = require('superagent');
const cors = require('cors');
// const userLog = require('../auth/userLog');

const app = express();

app.use(cors());
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({extended:false}));
app.set('view engine', 'ejs');


app.use(logger);

app.use(authRoutes);
// app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// app.use('/user', userLog);


app.use('*', notFoundHandler);
app.use(errorHandler);

module.exports = {
  server: app,
  start: port => {
    if (!port) { throw new Error('Missing Port'); }
    app.listen(port, () => console.log(`Listening on ${port}`));
  },
};
