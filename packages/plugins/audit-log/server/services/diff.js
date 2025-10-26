'use strict';

/**
 * Diff service
 * Generates field-level diffs between old and new data
 */
module.exports = ({ strapi }) => ({
  /**
   * Generate a diff between old and new data
   * Returns an object with changed fields showing old and new values
   */
  generateDiff(oldData, newData, excludeFields = []) {
    const changes = {};

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    // Fields to always exclude from diff
    const systemFields = [
      'id',
      'createdAt',
      'updatedAt',
      'publishedAt',
      'createdBy',
      'updatedBy',
      ...excludeFields,
    ];

    allKeys.forEach((key) => {
      // Skip excluded fields
      if (systemFields.includes(key)) {
        return;
      }

      const oldValue = oldData?.[key];
      const newValue = newData?.[key];

      // Check if values are different
      if (!this.areEqual(oldValue, newValue)) {
        changes[key] = {
          from: this.serializeValue(oldValue),
          to: this.serializeValue(newValue),
        };
      }
    });

    return changes;
  },

  /**
   * Check if two values are equal
   * Handles primitives, arrays, and objects
   */
  areEqual(value1, value2) {
    // Same reference or both null/undefined
    if (value1 === value2) {
      return true;
    }

    // One is null/undefined and the other isn't
    if (value1 == null || value2 == null) {
      return false;
    }

    // Handle dates
    if (value1 instanceof Date && value2 instanceof Date) {
      return value1.getTime() === value2.getTime();
    }

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) {
        return false;
      }

      return value1.every((item, index) => this.areEqual(item, value2[index]));
    }

    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every((key) => this.areEqual(value1[key], value2[key]));
    }

    // Primitives
    return false;
  },

  /**
   * Serialize value for storage
   * Handles various data types and converts to JSON-safe format
   */
  serializeValue(value) {
    // Handle null/undefined
    if (value == null) {
      return null;
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle arrays
    if (Array.isArray(value)) {
      // For relation arrays, extract just IDs
      if (value.length > 0 && typeof value[0] === 'object' && value[0].id) {
        return value.map((item) => item.id);
      }
      return value;
    }

    // Handle objects
    if (typeof value === 'object') {
      // For single relations, extract just the ID
      if (value.id !== undefined) {
        return value.id;
      }

      // For other objects, return as is (will be stored as JSON)
      return value;
    }

    // Primitives (string, number, boolean)
    return value;
  },

  /**
   * Generate a summary of changes
   * Returns a human-readable summary
   */
  generateSummary(changes) {
    const changedFields = Object.keys(changes);

    if (changedFields.length === 0) {
      return 'No changes detected';
    }

    if (changedFields.length === 1) {
      return `Changed ${changedFields[0]}`;
    }

    if (changedFields.length <= 3) {
      return `Changed ${changedFields.join(', ')}`;
    }

    return `Changed ${changedFields.length} fields`;
  },

  /**
   * Deep clone an object
   * Used to prevent mutation of original data
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }

    const cloned = {};
    Object.keys(obj).forEach((key) => {
      cloned[key] = this.deepClone(obj[key]);
    });

    return cloned;
  },
});