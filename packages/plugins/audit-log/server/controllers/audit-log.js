'use strict';

/**
 * Audit Log controller
 * Handles HTTP requests for audit log operations
 */
module.exports = ({ strapi }) => ({
  /**
   * Find audit logs with filtering, pagination, and sorting
   * GET /api/audit-logs
   */
  async find(ctx) {
    try {
      // Extract query parameters
      const { query } = ctx;

      // Get the audit log service
      const auditLogService = strapi.plugin('audit-log').service('auditLog');

      // Sanitize query parameters (security)
      const sanitizedQuery = await strapi
        .plugin('audit-log')
        .service('auditLog')
        .sanitizeQuery(query);

      // Fetch audit logs with filters and pagination
      const { results, pagination } = await auditLogService.find(sanitizedQuery);

      // Return formatted response
      ctx.body = {
        data: results,
        meta: {
          pagination,
        },
      };
    } catch (error) {
      strapi.log.error('[Audit Log Controller] Error in find:', error);
      ctx.throw(500, 'Failed to fetch audit logs');
    }
  },

  /**
   * Find a single audit log by ID
   * GET /api/audit-logs/:id
   */
  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      // Validate ID
      if (!id) {
        return ctx.badRequest('Missing audit log ID');
      }

      // Get the audit log service
      const auditLogService = strapi.plugin('audit-log').service('auditLog');

      // Fetch single audit log
      const log = await auditLogService.findOne(id);

      // Check if log exists
      if (!log) {
        return ctx.notFound('Audit log not found');
      }

      // Return the log
      ctx.body = {
        data: log,
      };
    } catch (error) {
      strapi.log.error('[Audit Log Controller] Error in findOne:', error);
      ctx.throw(500, 'Failed to fetch audit log');
    }
  },

  /**
   * Get audit log statistics/summary
   * GET /api/audit-logs/stats
   */
  async stats(ctx) {
    try {
      const { query } = ctx;

      // Get the audit log service
      const auditLogService = strapi.plugin('audit-log').service('auditLog');

      // Get statistics
      const stats = await auditLogService.getStats(query);

      // Return stats
      ctx.body = {
        data: stats,
      };
    } catch (error) {
      strapi.log.error('[Audit Log Controller] Error in stats:', error);
      ctx.throw(500, 'Failed to fetch audit log statistics');
    }
  },

  /**
   * Delete old audit logs (cleanup)
   * DELETE /api/audit-logs/cleanup
   * Requires admin privileges
   */
  async cleanup(ctx) {
    try {
      const { olderThan } = ctx.request.body;

      // Validate olderThan parameter (should be a date)
      if (!olderThan) {
        return ctx.badRequest('Missing "olderThan" parameter (date string required)');
      }

      const date = new Date(olderThan);
      if (isNaN(date.getTime())) {
        return ctx.badRequest('Invalid date format for "olderThan"');
      }

      // Get the audit log service
      const auditLogService = strapi.plugin('audit-log').service('auditLog');

      // Delete old logs
      const deletedCount = await auditLogService.deleteOlderThan(date);

      // Return result
      ctx.body = {
        data: {
          deletedCount,
          message: `Successfully deleted ${deletedCount} audit log(s)`,
        },
      };
    } catch (error) {
      strapi.log.error('[Audit Log Controller] Error in cleanup:', error);
      ctx.throw(500, 'Failed to cleanup audit logs');
    }
  },
});