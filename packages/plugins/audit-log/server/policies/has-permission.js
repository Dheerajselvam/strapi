'use strict';

/**
 * Has Permission Policy
 * Checks if the user has permission to access audit logs
 */
module.exports = async (policyContext, config, { strapi }) => {
  const { state } = policyContext;

  // Check if user is authenticated
  if (!state.user) {
    return {
      name: 'Unauthorized',
      message: 'You must be authenticated to access audit logs',
    };
  }

  // Get the user's role
  const userRole = state.user.role;

  // Super admin always has access
  if (userRole?.code === 'strapi-super-admin') {
    return true;
  }

  try {
    // Check if user has the specific permission to read audit logs
    const hasPermission = await strapi
      .plugin('admin')
      .service('permission')
      .hasPermission(state.user, {
        action: 'plugin::audit-log.read',
      });

    if (hasPermission) {
      return true;
    }

    // Permission denied
    return {
      name: 'Forbidden',
      message: 'You do not have permission to access audit logs',
    };
  } catch (error) {
    strapi.log.error('[Audit Log Policy] Error checking permissions:', error);
    
    return {
      name: 'InternalServerError',
      message: 'Failed to verify permissions',
    };
  }
};