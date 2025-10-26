'use strict';

module.exports = {
  info: {
    singularName: 'audit-log',
    pluralName: 'audit-logs',
    displayName: 'Audit Log',
    description: 'Stores audit log entries',
  },
  options: {
    draftAndPublish: false,
  },
  attributes: {
    action: { type: 'string', required: true },
    contentType: { type: 'string', required: true },
    recordId: { type: 'string', required: true },
    userId: { type: 'string' },
    changes: { type: 'json' },
    createdAt: { type: 'datetime' },
  },
};
