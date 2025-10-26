'use strict';

const register = require('./server/register');
const bootstrap = require('./server/bootstrap');
const config = require('./server/config');
const contentTypes = require('./server/content-types');
const controllers = require('./server/controllers');
const routes = require('./server/routes');
const middlewares = require('./server/middlewares');
const policies = require('./server/policies');
const services = require('./server/services');

module.exports = {
  register,
  bootstrap,
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares,
};