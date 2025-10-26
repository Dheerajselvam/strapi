'use strict';

/**
 * Register phase of the plugin
 * This is called during Strapi initialization, before bootstrap
 * Use this to register permissions and extend existing functionality
 */
module.exports = ({ strapi }) => {
  // Register permission actions for the audit-log plugin
  const actions = [
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: 'audit-log',
    },
  ];

  // Register the permissions with Strapi's RBAC system
  strapi.admin?.services?.permission?.actionProvider?.registerMany(actions);

  // Log successful registration
  strapi.log.info('[Audit Log] Plugin registered successfully');
};