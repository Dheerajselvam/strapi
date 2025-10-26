'use strict';

module.exports = ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    const service = strapi.plugin('audit-log').service('auditLog');
    const results = await service.find({
      filters: query.filters,
      sort: query.sort,
      limit: query.limit,
      start: query.start,
    });
    ctx.body = { data: results };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const service = strapi.plugin('audit-log').service('auditLog');
    const log = await service.findOne(id);
    if (!log) return ctx.notFound('Audit log not found');
    ctx.body = { data: log };
  },
});
