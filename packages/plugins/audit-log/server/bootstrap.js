'use strict';

/**
 * Bootstrap phase of the plugin
 * This is called after all plugins are registered and loaded
 * Use this to set up lifecycle hooks and initialize the plugin
 */
module.exports = async ({ strapi }) => {
  try {
    // Get plugin configuration
    const config = strapi.config.get('plugin.audit-log', {
      enabled: true,
      excludeContentTypes: [],
      excludeFields: ['password', 'resetPasswordToken', 'confirmationToken'],
    });

    // Check if audit logging is enabled
    if (!config.enabled) {
      strapi.log.info('[Audit Log] Plugin is disabled via configuration');
      return;
    }

    // Get the lifecycle hooks middleware
    const lifecycleMiddleware = strapi.plugin('audit-log').middleware('lifecycleHooks');

    // Register lifecycle hooks for all content types
    const registeredCount = lifecycleMiddleware.registerAll();

    // Log successful initialization
    strapi.log.info('[Audit Log] Plugin initialized successfully');
    strapi.log.info(`[Audit Log] Monitoring ${registeredCount} content types for changes`);
  } catch (error) {
    strapi.log.error('[Audit Log] Failed to bootstrap plugin:', error);
    throw error;
  }
};