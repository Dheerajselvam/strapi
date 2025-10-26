'use strict';

/**
 * Default configuration for the audit-log plugin
 * Users can override these settings in their project's config/plugins.js file
 */
module.exports = {
  default: {
    /**
     * Enable or disable audit logging globally
     * @type {boolean}
     * @default true
     */
    enabled: true,

    /**
     * Array of content type UIDs to exclude from audit logging
     * These content types will not trigger audit log entries
     * @type {string[]}
     * @default []
     * @example ['api::newsletter.newsletter', 'api::comment.comment']
     */
    excludeContentTypes: [],

    /**
     * Array of field names to exclude from audit logs
     * These fields will be removed from the logged data for security
     * @type {string[]}
     * @default ['password', 'resetPasswordToken', 'confirmationToken']
     */
    excludeFields: [
      'password',
      'resetPasswordToken',
      'confirmationToken',
      'registrationToken',
      'passwordResetToken',
      'jwtSecret',
      'apiToken',
    ],

    /**
     * Maximum depth for diff generation on nested objects
     * Higher values = more detailed diffs but more storage
     * @type {number}
     * @default 5
     */
    maxDiffDepth: 5,

    /**
     * Store full payload for create actions
     * If false, only stores essential fields
     * @type {boolean}
     * @default true
     */
    captureFullPayloadOnCreate: true,

    /**
     * Store full payload for delete actions
     * If false, only stores the record ID
     * @type {boolean}
     * @default true
     */
    captureFullPayloadOnDelete: true,
  },

  /**
   * Validator function for configuration
   * Ensures configuration values are valid
   */
  validator: (config) => {
    // Validate enabled flag
    if (typeof config.enabled !== 'boolean') {
      throw new Error('[Audit Log] Configuration error: "enabled" must be a boolean');
    }

    // Validate excludeContentTypes
    if (!Array.isArray(config.excludeContentTypes)) {
      throw new Error('[Audit Log] Configuration error: "excludeContentTypes" must be an array');
    }

    // Validate excludeFields
    if (!Array.isArray(config.excludeFields)) {
      throw new Error('[Audit Log] Configuration error: "excludeFields" must be an array');
    }

    // Validate maxDiffDepth
    if (typeof config.maxDiffDepth !== 'number' || config.maxDiffDepth < 1) {
      throw new Error('[Audit Log] Configuration error: "maxDiffDepth" must be a positive number');
    }

    // Validate boolean flags
    if (typeof config.captureFullPayloadOnCreate !== 'boolean') {
      throw new Error('[Audit Log] Configuration error: "captureFullPayloadOnCreate" must be a boolean');
    }

    if (typeof config.captureFullPayloadOnDelete !== 'boolean') {
      throw new Error('[Audit Log] Configuration error: "captureFullPayloadOnDelete" must be a boolean');
    }
  },
};