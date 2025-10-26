'use strict';

/**
 * Lifecycle Hooks Middleware
 * Registers global lifecycle hooks to capture content changes
 * This is called from bootstrap.js
 */
module.exports = ({ strapi }) => {
  return {
    /**
     * Register lifecycle hooks for a specific content type
     */
    register(uid) {
      // Get plugin configuration
      const config = strapi.config.get('plugin.audit-log', {
        enabled: true,
        excludeContentTypes: [],
      });

      // List of content types to exclude
      const excludeList = [
        'plugin::audit-log.log', // Prevent infinite loops
        'admin::api-token',
        'admin::api-token-permission',
        'admin::transfer-token',
        'admin::transfer-token-permission',
        'admin::permission',
        'admin::user',
        'admin::role',
        ...config.excludeContentTypes,
      ];

      // Skip if content type is excluded
      if (excludeList.includes(uid)) {
        return;
      }

      // Get the audit log service
      const auditLogService = strapi.plugin('audit-log').service('auditLog');

      // Register lifecycle hooks
      strapi.db.lifecycles.subscribe({
        models: [uid],

        /**
         * Before update - capture the old state for diff generation
         */
        async beforeUpdate(event) {
          const { where } = event.params;

          try {
            // Fetch the current state before update
            const existingRecord = await strapi.db.query(uid).findOne({ where });

            if (existingRecord) {
              // Store in event params for access in afterUpdate
              event.params._auditLogOldData = existingRecord;
            }
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error in beforeUpdate for ${uid}:`, error);
          }
        },

        /**
         * After create - log the creation
         */
        async afterCreate(event) {
          const { result } = event;

          try {
            // Skip if no result
            if (!result) return;

            await auditLogService.logAction({
              contentType: uid,
              recordId: result.id?.toString(),
              action: 'create',
              data: result,
              ctx: strapi.requestContext.get(),
            });
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging create for ${uid}:`, error);
          }
        },

        /**
         * After update - log the update with diff
         */
        async afterUpdate(event) {
          const { result, params } = event;
          const oldData = params._auditLogOldData;

          try {
            // Skip if no result
            if (!result) return;

            await auditLogService.logAction({
              contentType: uid,
              recordId: result.id?.toString(),
              action: 'update',
              data: result,
              oldData: oldData,
              ctx: strapi.requestContext.get(),
            });

            // Clean up stored old data
            delete params._auditLogOldData;
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging update for ${uid}:`, error);
          }
        },

        /**
         * After delete - log the deletion
         */
        async afterDelete(event) {
          const { result } = event;

          try {
            // Skip if no result
            if (!result) return;

            await auditLogService.logAction({
              contentType: uid,
              recordId: result.id?.toString(),
              action: 'delete',
              data: result,
              ctx: strapi.requestContext.get(),
            });
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging delete for ${uid}:`, error);
          }
        },

        /**
         * After create many - log bulk creates
         */
        async afterCreateMany(event) {
          const { result } = event;

          try {
            // Skip if no results
            if (!result || !result.count) return;

            // Log bulk operation
            await auditLogService.logAction({
              contentType: uid,
              recordId: 'bulk',
              action: 'create',
              data: { count: result.count, ids: result.ids || [] },
              ctx: strapi.requestContext.get(),
            });
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging bulk create for ${uid}:`, error);
          }
        },

        /**
         * After update many - log bulk updates
         */
        async afterUpdateMany(event) {
          const { result } = event;

          try {
            // Skip if no results
            if (!result || !result.count) return;

            // Log bulk operation
            await auditLogService.logAction({
              contentType: uid,
              recordId: 'bulk',
              action: 'update',
              data: { count: result.count },
              ctx: strapi.requestContext.get(),
            });
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging bulk update for ${uid}:`, error);
          }
        },

        /**
         * After delete many - log bulk deletes
         */
        async afterDeleteMany(event) {
          const { result } = event;

          try {
            // Skip if no results
            if (!result || !result.count) return;

            // Log bulk operation
            await auditLogService.logAction({
              contentType: uid,
              recordId: 'bulk',
              action: 'delete',
              data: { count: result.count },
              ctx: strapi.requestContext.get(),
            });
          } catch (error) {
            strapi.log.error(`[Audit Log Middleware] Error logging bulk delete for ${uid}:`, error);
          }
        },
      });
    },

    /**
     * Register hooks for all content types
     */
    registerAll() {
      const contentTypes = Object.keys(strapi.contentTypes);

      let registeredCount = 0;

      contentTypes.forEach((uid) => {
        try {
          this.register(uid);
          registeredCount++;
        } catch (error) {
          strapi.log.error(`[Audit Log Middleware] Failed to register hooks for ${uid}:`, error);
        }
      });

      strapi.log.info(`[Audit Log Middleware] Registered lifecycle hooks for ${registeredCount} content types`);

      return registeredCount;
    },
  };
};