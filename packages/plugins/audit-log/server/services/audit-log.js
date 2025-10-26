'use strict';

module.exports = ({ strapi }) => ({
  async logAction({ action, contentType, recordId, userId, changes }) {
    return strapi.db.query('plugin::audit-log.audit-log').create({
      data: { action, contentType, recordId, userId, changes },
    });
  },

  async find(query) {
    return strapi.db.query('plugin::audit-log.audit-log').findMany({
      where: query.filters,
      orderBy: query.sort,
      limit: query.limit || 25,
      offset: query.start || 0,
    });
  },

  async findOne(id) {
    return strapi.db.query('plugin::audit-log.audit-log').findOne({ where: { id } });
  },
});
