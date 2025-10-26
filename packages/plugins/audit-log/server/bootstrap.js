'use strict';

module.exports = async ({ strapi }) => {
  const enabled = strapi.config.get('plugin.audit-log.enabled', true);
  const excluded = strapi.config.get('plugin.audit-log.excludeContentTypes', []);

  if (!enabled) return;

  const contentTypes = Object.keys(strapi.contentTypes).filter(
    uid => !excluded.includes(uid)
  );

  for (const uid of contentTypes) {
    const model = strapi.contentTypes[uid];

    strapi.db.lifecycles.subscribe({
      models: [uid],
      afterCreate(event) {
        const { result, params } = event;
        strapi.plugin('audit-log').service('auditLog').logAction({
          action: 'create',
          contentType: uid,
          recordId: result.id.toString(),
          userId: params.user?.id,
          changes: result,
        });
      },
      afterUpdate(event) {
        const { result, params } = event;
        strapi.plugin('audit-log').service('auditLog').logAction({
          action: 'update',
          contentType: uid,
          recordId: result.id.toString(),
          userId: params.user?.id,
          changes: result,
        });
      },
      afterDelete(event) {
        const { result, params } = event;
        strapi.plugin('audit-log').service('auditLog').logAction({
          action: 'delete',
          contentType: uid,
          recordId: result.id.toString(),
          userId: params.user?.id,
          changes: result,
        });
      },
    });
  }
};
