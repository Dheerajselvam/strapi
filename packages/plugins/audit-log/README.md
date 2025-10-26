# Strapi Audit Log Plugin

Automated audit logging for all content changes performed through Strapi's Content API.

## Features

- 🔍 **Automatic Tracking** - Captures create, update, and delete operations on all content types
- 📊 **Comprehensive Metadata** - Logs user, timestamp, content type, action, and field changes
- 🔐 **Role-Based Access** - Restrict audit log access with permissions
- ⚙️ **Configurable** - Enable/disable logging and exclude specific content types
- 🚀 **REST API** - Query, filter, and paginate audit logs via REST endpoints

## Installation

This plugin is included in your Strapi installation under `packages/plugins/audit-log/`.

## Configuration

Add configuration to your `config/plugins.js` file:

```javascript
module.exports = {
  'audit-log': {
    enabled: true,
    config: {
      // Enable or disable audit logging globally
      enabled: true,
      
      // Exclude specific content types from being logged
      excludeContentTypes: [
        'admin::user',
        'admin::role',
        'plugin::upload.file'
      ],
      
      // Exclude sensitive fields from being logged
      excludeFields: [
        'password',
        'resetPasswordToken',
        'confirmationToken'
      ]
    }
  }
};
```

## API Endpoints

### List Audit Logs

```
GET /api/audit-logs
```

**Query Parameters:**
- `filters[contentType][$eq]` - Filter by content type (e.g., `api::article.article`)
- `filters[action][$in]` - Filter by action type (create, update, delete)
- `filters[user][id][$eq]` - Filter by user ID
- `filters[createdAt][$gte]` - Filter by date (greater than or equal)
- `filters[createdAt][$lte]` - Filter by date (less than or equal)
- `pagination[page]` - Page number (default: 1)
- `pagination[pageSize]` - Items per page (default: 25)
- `sort` - Sort order (e.g., `createdAt:desc`)

**Example:**
```bash
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[contentType][$eq]=api::article.article&pagination[page]=1&pagination[pageSize]=25' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "123",
      "action": "update",
      "userId": 1,
      "username": "admin",
      "changes": {
        "title": {
          "from": "Old Title",
          "to": "New Title"
        },
        "publishedAt": {
          "from": null,
          "to": "2025-10-25T10:30:00.000Z"
        }
      },
      "createdAt": "2025-10-25T10:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

### Get Single Audit Log

```
GET /api/audit-logs/:id
```

## Permissions

To access audit logs, users must have the `plugin::audit-log.logs.read` permission.

**Setting Permissions:**
1. Go to Settings → Roles
2. Select a role (e.g., Editor, Author)
3. Under "Audit Log" plugin, enable "Read" permission
4. Save

## Audit Log Schema

Each audit log entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `contentType` | string | The content type identifier (e.g., `api::article.article`) |
| `recordId` | string | The ID of the affected record |
| `action` | enum | The operation performed: `create`, `update`, or `delete` |
| `userId` | integer | ID of the user who performed the action (null for system actions) |
| `username` | string | Username of the user who performed the action |
| `changes` | json | Object containing field changes (for updates) or full data (for creates/deletes) |
| `createdAt` | datetime | When the action occurred |

## Architecture

The audit log plugin uses Strapi's lifecycle hooks to automatically intercept content operations:

1. **Lifecycle Hooks** - Registered globally to listen to `afterCreate`, `afterUpdate`, `afterDelete` events
2. **Metadata Extraction** - Captures user context, content type, and record data from the Strapi context
3. **Diff Generation** - For updates, compares before/after states to track field changes
4. **Storage** - Writes audit log entries to the `plugin_audit_log_logs` table
5. **Access Control** - Uses Strapi's RBAC system to restrict log access

## Development

### Running Tests
```bash
npm run test:unit
```

### Building the Plugin
```bash
npm run build
```

## Troubleshooting

**Logs not appearing:**
- Check that `audit-log.enabled` is set to `true` in your config
- Verify the content type is not in the `excludeContentTypes` list
- Check server logs for any errors

**Permission denied:**
- Ensure the user's role has `plugin::audit-log.logs.read` permission enabled

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.