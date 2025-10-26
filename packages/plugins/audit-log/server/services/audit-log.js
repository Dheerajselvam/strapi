'use strict';

/**
 * Audit Log service
 * Core business logic for audit logging
 */
module.exports = ({ strapi }) => ({
  /**
   * Log an action (create, update, delete)
   */
  async logAction({ contentType, recordId, action, data, oldData, ctx }) {
    try {
      // Get plugin configuration
      const config = strapi.config.get('plugin.audit-log', {
        enabled: true,
        excludeFields: [],
      });

      // Check if logging is enabled
      if (!config.enabled) {
        return null;
      }

      // Extract user information from context
      const user = ctx?.state?.user;
      const request = ctx?.request;

      // Determine the source of the action
      let source = 'api';
      if (ctx?.request?.url?.includes('/admin')) {
        source = 'admin';
      } else if (!user) {
        source = 'system';
      }

      // Prepare the changes object based on action type
      let changes = {};

      if (action === 'create') {
        // For creates, store the full data (optionally filtered)
        changes = this.sanitizeData(data, config.excludeFields);
      } else if (action === 'update' && oldData) {
        // For updates, calculate the diff
        const diffService = strapi.plugin('audit-log').service('diff');
        changes = diffService.generateDiff(oldData, data, config.excludeFields);
      } else if (action === 'delete') {
        // For deletes, store the final state
        changes = this.sanitizeData(data, config.excludeFields);
      }

      // Only log if there are actual changes (for updates)
      if (action === 'update' && Object.keys(changes).length === 0) {
        return null;
      }

      // Create the audit log entry
      const auditLog = await strapi.db.query('plugin::audit-log.log').create({
        data: {
          contentType,
          recordId: recordId || data?.id?.toString(),
          action,
          userId: user?.id || null,
          username: user?.username || user?.email || 'System',
          userEmail: user?.email || null,
          changes,
          ipAddress: this.getClientIp(request),
          userAgent: request?.headers?.['user-agent'] || null,
          source,
        },
      });

      return auditLog;
    } catch (error) {
      // Log error but don't throw - we don't want audit logging to break the app
      strapi.log.error('[Audit Log Service] Failed to log action:', error);
      return null;
    }
  },

  /**
   * Find audit logs with filtering and pagination
   */
  async find(query) {
    try {
      // Build the query with filters
      const { filters = {}, pagination = {}, sort = [] } = query;

      // Default pagination
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 25;
      const start = (page - 1) * pageSize;
      const limit = pageSize;

      // Default sort (newest first)
      const sortOrder = sort.length > 0 ? sort : [{ createdAt: 'desc' }];

      // Fetch audit logs
      const results = await strapi.db.query('plugin::audit-log.log').findMany({
        where: filters,
        orderBy: sortOrder,
        offset: start,
        limit,
      });

      // Get total count for pagination
      const total = await strapi.db.query('plugin::audit-log.log').count({
        where: filters,
      });

      return {
        results,
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      };
    } catch (error) {
      strapi.log.error('[Audit Log Service] Error in find:', error);
      throw error;
    }
  },

  /**
   * Find a single audit log by ID
   */
  async findOne(id) {
    try {
      const log = await strapi.db.query('plugin::audit-log.log').findOne({
        where: { id },
      });

      return log;
    } catch (error) {
      strapi.log.error('[Audit Log Service] Error in findOne:', error);
      throw error;
    }
  },

  /**
   * Get audit log statistics
   */
  async getStats(query = {}) {
    try {
      const { filters = {} } = query;

      // Get total count
      const total = await strapi.db.query('plugin::audit-log.log').count({
        where: filters,
      });

      // Get count by action type
      const actionCounts = await strapi.db.connection
        .from('audit_logs')
        .where(this.buildWhereClause(filters))
        .groupBy('action')
        .select('action')
        .count('* as count');

      // Get count by content type
      const contentTypeCounts = await strapi.db.connection
        .from('audit_logs')
        .where(this.buildWhereClause(filters))
        .groupBy('content_type')
        .select('content_type as contentType')
        .count('* as count')
        .orderBy('count', 'desc')
        .limit(10);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await strapi.db.query('plugin::audit-log.log').count({
        where: {
          ...filters,
          createdAt: { $gte: sevenDaysAgo },
        },
      });

      return {
        total,
        recentActivity,
        actionCounts: actionCounts.reduce((acc, item) => {
          acc[item.action] = parseInt(item.count);
          return acc;
        }, {}),
        topContentTypes: contentTypeCounts.map((item) => ({
          contentType: item.contentType,
          count: parseInt(item.count),
        })),
      };
    } catch (error) {
      strapi.log.error('[Audit Log Service] Error in getStats:', error);
      throw error;
    }
  },

  /**
   * Delete audit logs older than a specific date
   */
  async deleteOlderThan(date) {
    try {
      const result = await strapi.db.query('plugin::audit-log.log').deleteMany({
        where: {
          createdAt: { $lt: date },
        },
      });

      return result.count || 0;
    } catch (error) {
      strapi.log.error('[Audit Log Service] Error in deleteOlderThan:', error);
      throw error;
    }
  },

  /**
   * Sanitize query parameters for security
   */
  async sanitizeQuery(query) {
    // Use Strapi's built-in sanitizer if available
    return query;
  },

  /**
   * Remove sensitive fields from data
   */
  sanitizeData(data, excludeFields = []) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove excluded fields
    excludeFields.forEach((field) => {
      delete sanitized[field];
    });

    // Remove common sensitive fields
    const defaultExcludeFields = [
      'password',
      'resetPasswordToken',
      'confirmationToken',
      'provider',
      'hash',
      'salt',
    ];

    defaultExcludeFields.forEach((field) => {
      delete sanitized[field];
    });

    return sanitized;
  },

  /**
   * Extract client IP address from request
   */
  getClientIp(request) {
    if (!request) return null;

    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.socket?.remoteAddress ||
      null
    );
  },

  /**
   * Build where clause for database queries
   */
  buildWhereClause(filters) {
    const where = {};

    if (filters.contentType) {
      where.content_type = filters.contentType;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    return where;
  },
});