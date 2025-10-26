'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: 'audit-log.find',
    config: {
      policies: ['plugin::audit-log.has-permission'],
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/:id',
    handler: 'audit-log.findOne',
    config: {
      policies: ['plugin::audit-log.has-permission'],
    },
  },
];
