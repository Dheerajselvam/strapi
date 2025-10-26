'use strict';

const log = require('./audit-log');

/**
 * Export all content types for the audit-log plugin
 * These are registered with Strapi as plugin::<pluginName>.<contentTypeName>
 * In this case: plugin::audit-log.log
 */
module.exports = {
  log,
};