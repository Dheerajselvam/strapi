'use strict';

/**
 * Audit Log routes
 * Defines all API endpoints for the audit-log plugin
 */
module.exports = [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: 'auditLog.find',
    config: {
      policies: ['plugin::audit-log.has-permission'],
      description: 'Get a list of audit logs with filtering and pagination',
      tag: 'Audit Log',
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/stats',
    handler: 'auditLog.stats',
    config: {
      policies: ['plugin::audit-log.has-permission'],
      description: 'Get audit log statistics',
      tag: 'Audit Log',
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/:id',
    handler: 'auditLog.findOne',
    config: {
      policies: ['plugin::audit-log.has-permission'],
      description: 'Get a single audit log by ID',
      tag: 'Audit Log',
    },
  },
  {
    method: 'DELETE',
    path: '/audit-logs/cleanup',
    handler: 'auditLog.cleanup',
    config: {
      policies: ['plugin::audit-log.has-permission', 'admin::isAuthenticatedAdmin'],
      description: 'Delete audit logs older than a specific date',
      tag: 'Audit Log',
    },
  },
];