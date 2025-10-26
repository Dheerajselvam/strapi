# Strapi Audit Log Plugin

**Automated audit logging for all content changes in Strapi**

Track every create, update, and delete operation across all content types with comprehensive metadata, user attribution, and field-level change tracking.

---

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Permissions](#permissions)
- [Audit Log Schema](#audit-log-schema)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

---

## ✨ Features

- 🔍 **Automatic Tracking** - Captures all content operations via lifecycle hooks
- 📊 **Field-Level Diffs** - Shows exactly what changed in updates (before/after)
- 👤 **User Attribution** - Records who made each change with full context
- 🌐 **IP & User Agent Tracking** - Captures request metadata for security auditing
- 🔐 **Role-Based Access Control** - Restrict audit log access with Strapi's RBAC
- ⚙️ **Highly Configurable** - Enable/disable globally, exclude content types and fields
- 🚀 **Bulk Operation Support** - Tracks createMany, updateMany, deleteMany
- 📈 **Statistics API** - Get insights on audit activity
- 🧹 **Cleanup API** - Delete old logs to manage storage
- 🛡️ **Security-First** - Automatically excludes sensitive fields (passwords, tokens)
- ⚡ **Performance Optimized** - Minimal overhead, doesn't block main operations

---

## 📦 Installation

This plugin is included in your Strapi installation at:

```
packages/plugins/audit-log/
```

### Activate the Plugin

1. **Add to plugins configuration** - Create or modify `config/plugins.js`:

```javascript
module.exports = {
  'audit-log': {
    enabled: true,
  },
};
```

2. **Restart Strapi**:

```bash
npm run develop
```

3. **Verify Installation** - Check the console for:

```
[Audit Log] Plugin registered successfully
[Audit Log] Plugin initialized successfully
[Audit Log] Monitoring X content types for changes
```

---

## ⚙️ Configuration

### Basic Configuration

Add configuration to `config/plugins.js`:

```javascript
module.exports = {
  'audit-log': {
    enabled: true,
    config: {
      // Enable or disable audit logging globally
      enabled: true,
      
      // Exclude specific content types from being logged
      excludeContentTypes: [
        'api::newsletter.newsletter',
        'api::comment.comment',
      ],
      
      // Exclude sensitive fields from being logged
      excludeFields: [
        'password',
        'resetPasswordToken',
        'confirmationToken',
        'apiToken',
        'jwtSecret',
      ],
      
      // Maximum depth for nested object diffs
      maxDiffDepth: 5,
      
      // Store full payload for create actions
      captureFullPayloadOnCreate: true,
      
      // Store full payload for delete actions
      captureFullPayloadOnDelete: true,
    },
  },
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Master switch for audit logging |
| `excludeContentTypes` | array | `[]` | Content type UIDs to skip logging |
| `excludeFields` | array | `[passwords, tokens]` | Field names to exclude from logs |
| `maxDiffDepth` | number | `5` | Maximum depth for nested object comparison |
| `captureFullPayloadOnCreate` | boolean | `true` | Store complete data on creates |
| `captureFullPayloadOnDelete` | boolean | `true` | Store complete data on deletes |

### Automatically Excluded Content Types

The following are excluded by default to prevent infinite loops and unnecessary logging:

- `plugin::audit-log.log` (the audit log itself)
- `admin::api-token`
- `admin::transfer-token`
- `admin::permission`
- `admin::user`
- `admin::role`

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Content API Request                      │
│                  (Create/Update/Delete)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Strapi Lifecycle Hooks                     │
│  beforeUpdate → afterCreate → afterUpdate → afterDelete      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Lifecycle Hooks Middleware                      │
│    • Captures old state (beforeUpdate)                       │
│    • Triggers audit logging (after* hooks)                   │
│    • Handles bulk operations                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Audit Log Service                          │
│    • Extracts user context & metadata                        │
│    • Sanitizes sensitive data                                │
│    • Generates diffs (for updates)                           │
│    • Creates audit log entry                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Diff Service                            │
│    • Compares old vs new data                                │
│    • Generates field-level changes                           │
│    • Serializes values (dates, relations)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (audit_logs)                      │
│              Stores immutable audit records                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

**1. Bootstrap (`bootstrap.js`)**
- Initializes the plugin on Strapi startup
- Loads configuration
- Registers lifecycle hooks for all content types

**2. Lifecycle Hooks Middleware (`middlewares/lifecycle-hooks.js`)**
- Subscribes to Strapi's database lifecycle events
- Captures state before updates (for diff generation)
- Triggers audit logging after operations complete
- Handles both individual and bulk operations

**3. Audit Log Service (`services/audit-log.js`)**
- Core business logic for creating audit logs
- Extracts user information from request context
- Sanitizes sensitive data
- Calls diff service for updates
- Provides query methods for retrieving logs

**4. Diff Service (`services/diff.js`)**
- Compares old and new data states
- Generates field-level change objects
- Handles nested objects, arrays, and relations
- Serializes complex types (dates, relations)

**5. Controller (`controllers/audit-log.js`)**
- HTTP request handlers
- Validates input
- Calls services
- Formats responses

**6. Policy (`policies/has-permission.js`)**
- RBAC enforcement
- Checks user authentication
- Verifies `plugin::audit-log.read` permission

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api/audit-logs` and require authentication + permission.

### 1. List Audit Logs

```http
GET /api/audit-logs
```

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `filters[contentType][$eq]` | string | Filter by content type | `api::article.article` |
| `filters[action][$in]` | array | Filter by actions | `create,update` |
| `filters[userId][$eq]` | integer | Filter by user ID | `1` |
| `filters[createdAt][$gte]` | datetime | From date | `2025-01-01` |
| `filters[createdAt][$lte]` | datetime | To date | `2025-12-31` |
| `pagination[page]` | integer | Page number | `1` |
| `pagination[pageSize]` | integer | Items per page | `25` |
| `sort` | string | Sort order | `createdAt:desc` |

**Example Request:**

```bash
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[contentType][$eq]=api::article.article&filters[action][$in]=update&pagination[page]=1&pagination[pageSize]=25&sort=createdAt:desc' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Example Response:**

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
      "userEmail": "admin@example.com",
      "changes": {
        "title": {
          "from": "Old Title",
          "to": "New Title"
        },
        "status": {
          "from": "draft",
          "to": "published"
        }
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "source": "admin",
      "createdAt": "2025-10-25T10:30:00.000Z",
      "updatedAt": "2025-10-25T10:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 5,
      "total": 123
    }
  }
}
```

### 2. Get Single Audit Log

```http
GET /api/audit-logs/:id
```

**Example Request:**

```bash
curl -X GET \
  'http://localhost:1337/api/audit-logs/1' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Example Response:**

```json
{
  "data": {
    "id": 1,
    "contentType": "api::article.article",
    "recordId": "123",
    "action": "delete",
    "userId": 1,
    "username": "admin",
    "changes": {
      "title": "Deleted Article",
      "content": "Article content...",
      "status": "published"
    },
    "createdAt": "2025-10-25T10:30:00.000Z"
  }
}
```

### 3. Get Statistics

```http
GET /api/audit-logs/stats
```

**Query Parameters:**
- Same filtering options as list endpoint
- Statistics are calculated based on filters

**Example Request:**

```bash
curl -X GET \
  'http://localhost:1337/api/audit-logs/stats?filters[createdAt][$gte]=2025-10-01' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Example Response:**

```json
{
  "data": {
    "total": 1523,
    "recentActivity": 234,
    "actionCounts": {
      "create": 412,
      "update": 987,
      "delete": 124
    },
    "topContentTypes": [
      {
        "contentType": "api::article.article",
        "count": 543
      },
      {
        "contentType": "api::product.product",
        "count": 321
      }
    ]
  }
}
```

### 4. Cleanup Old Logs

```http
DELETE /api/audit-logs/cleanup
```

**Requires:** Admin role

**Request Body:**

```json
{
  "olderThan": "2025-01-01T00:00:00.000Z"
}
```

**Example Request:**

```bash
curl -X DELETE \
  'http://localhost:1337/api/audit-logs/cleanup' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"olderThan": "2025-01-01T00:00:00.000Z"}'
```

**Example Response:**

```json
{
  "data": {
    "deletedCount": 543,
    "message": "Successfully deleted 543 audit log(s)"
  }
}
```

---

## 🔐 Permissions

### Setting Up Permissions

1. **Navigate to Settings**
   - Go to Strapi Admin Panel
   - Settings → Roles

2. **Select a Role**
   - Choose the role (e.g., Editor, Author, Custom Role)

3. **Enable Audit Log Permission**
   - Find "Audit Log" plugin section
   - Enable "Read" permission
   - Save changes

4. **Super Admin**
   - Super admins automatically have full access
   - No configuration needed

### Permission Details

**Permission UID:** `plugin::audit-log.read`

**Grants Access To:**
- List audit logs (GET `/api/audit-logs`)
- View single audit log (GET `/api/audit-logs/:id`)
- View statistics (GET `/api/audit-logs/stats`)

**Admin-Only Actions:**
- Cleanup old logs (DELETE `/api/audit-logs/cleanup`)

### Programmatic Permission Check

```javascript
// Check if user has audit log read permission
const hasPermission = await strapi
  .plugin('admin')
  .service('permission')
  .hasPermission(user, {
    action: 'plugin::audit-log.read',
  });
```

---

## 📊 Audit Log Schema

### Database Table: `audit_logs`

| Field | Type | Description | Indexed |
|-------|------|-------------|---------|
| `id` | integer | Primary key | ✅ |
| `contentType` | string | Content type UID (e.g., `api::article.article`) | ✅ |
| `recordId` | string | ID of the modified record | ✅ |
| `action` | enum | Operation type: `create`, `update`, `delete` | ✅ |
| `userId` | integer | User who performed the action (null for system) | ✅ |
| `username` | string | Cached username for display | |
| `userEmail` | email | Cached email address | |
| `changes` | json | Field changes or full data | |
| `ipAddress` | string | Client IP address | |
| `userAgent` | text | Browser/client user agent | |
| `source` | enum | Source: `api`, `admin`, `system`, `plugin` | |
| `createdAt` | datetime | When the action occurred | ✅ |
| `updatedAt` | datetime | When the log was last modified | |

### Changes Object Structure

**For Creates:**
```json
{
  "title": "New Article",
  "content": "Article content...",
  "status": "draft"
}
```

**For Updates:**
```json
{
  "title": {
    "from": "Old Title",
    "to": "New Title"
  },
  "status": {
    "from": "draft",
    "to": "published"
  }
}
```

**For Deletes:**
```json
{
  "title": "Deleted Article",
  "content": "Final content state...",
  "status": "published"
}
```

**For Bulk Operations:**
```json
{
  "count": 15,
  "ids": [1, 2, 3, 4, 5]
}
```

---

## 📖 Usage Examples

### Example 1: Track Article Changes

**Scenario:** User updates an article

```javascript
// User performs update via API
PUT /api/articles/123
{
  "title": "Updated Title",
  "status": "published"
}

// Audit log automatically created:
{
  "contentType": "api::article.article",
  "recordId": "123",
  "action": "update",
  "userId": 5,
  "username": "editor",
  "changes": {
    "title": {
      "from": "Original Title",
      "to": "Updated Title"
    },
    "status": {
      "from": "draft",
      "to": "published"
    }
  }
}
```

### Example 2: Query Logs by User

```bash
# Get all changes made by user ID 5
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[userId][$eq]=5&sort=createdAt:desc' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Example 3: Find Recent Deletions

```bash
# Get all deletions in the last 7 days
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[action][$eq]=delete&filters[createdAt][$gte]=2025-10-18' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Example 4: Monitor Specific Content Type

```bash
# Get all product changes
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[contentType][$eq]=api::product.product' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Example 5: Cleanup Old Logs

```bash
# Delete logs older than 90 days
curl -X DELETE \
  'http://localhost:1337/api/audit-logs/cleanup' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "olderThan": "2025-07-27T00:00:00.000Z"
  }'
```

---

## 🛠️ Development

### Project Structure

```
packages/plugins/audit-log/
├── package.json                    # Plugin metadata
├── README.md                       # This file
├── strapi-server.js               # Server entry point
│
└── server/
    ├── register.js                # Permission registration
    ├── bootstrap.js               # Plugin initialization
    │
    ├── config/
    │   └── index.js              # Configuration schema
    │
    ├── content-types/
    │   ├── index.js              # Content type exports
    │   └── audit-log/
    │       ├── index.js          # Audit log export
    │       └── schema.json       # Database schema
    │
    ├── controllers/
    │   ├── index.js              # Controller exports
    │   └── audit-log.js          # HTTP handlers
    │
    ├── routes/
    │   └── index.js              # API endpoint definitions
    │
    ├── services/
    │   ├── index.js              # Service exports
    │   ├── audit-log.js          # Core business logic
    │   └── diff.js               # Diff generation
    │
    ├── middlewares/
    │   ├── index.js              # Middleware exports
    │   └── lifecycle-hooks.js    # Lifecycle hook manager
    │
    └── policies/
        ├── index.js              # Policy exports
        └── has-permission.js     # Permission check
```

### Running Tests

```bash
# Unit tests (when implemented)
npm run test:unit

# Integration tests (when implemented)
npm run test:integration
```

### Building the Plugin

```bash
# Build the plugin
npm run build

# Watch mode for development
npm run develop
```

---

## 🐛 Troubleshooting

### Issue: Logs Not Appearing

**Symptoms:** Content changes aren't being logged

**Solutions:**

1. **Check if plugin is enabled:**
   ```javascript
   // config/plugins.js
   'audit-log': {
     enabled: true, // ← Must be true
   }
   ```

2. **Verify content type isn't excluded:**
   ```javascript
   config: {
     excludeContentTypes: [
       // Make sure your content type isn't here
     ]
   }
   ```

3. **Check console for errors:**
   ```bash
   # Look for errors during startup
   [Audit Log] Failed to bootstrap plugin
   ```

4. **Verify lifecycle hooks registered:**
   ```bash
   # Should see on startup:
   [Audit Log] Monitoring X content types for changes
   ```

### Issue: Permission Denied

**Symptoms:** 403 Forbidden when accessing `/api/audit-logs`

**Solutions:**

1. **Verify user is authenticated:**
   - Include valid JWT token in Authorization header

2. **Check role permissions:**
   - Settings → Roles → [Your Role]
   - Enable "Read" under "Audit Log"

3. **Confirm permission is registered:**
   ```bash
   # Should see on startup:
   [Audit Log] Plugin registered successfully
   ```

### Issue: Database Errors

**Symptoms:** Failed to create audit log entry

**Solutions:**

1. **Run database migrations:**
   ```bash
   npm run strapi build
   ```

2. **Check database connection:**
   - Verify database is running
   - Check connection settings

3. **Verify table exists:**
   ```sql
   -- Check if audit_logs table exists
   SELECT * FROM audit_logs LIMIT 1;
   ```

### Issue: Large Database Size

**Symptoms:** audit_logs table growing too large

**Solutions:**

1. **Implement retention policy:**
   ```bash
   # Delete logs older than 90 days
   curl -X DELETE '/api/audit-logs/cleanup' \
     -d '{"olderThan": "2025-07-27"}'
   ```

2. **Set up automated cleanup:**
   - Use cron job or scheduled task
   - Run cleanup weekly/monthly

3. **Exclude high-volume content types:**
   ```javascript
   config: {
     excludeContentTypes: [
       'api::log-entry.log-entry', // High volume
       'api::analytics.analytics',
     ]
   }
   ```

### Issue: Performance Impact

**Symptoms:** Slower API responses after enabling audit log

**Solutions:**

1. **Optimize database:**
   - Ensure indexes exist (automatic in schema)
   - Run ANALYZE/OPTIMIZE on audit_logs table

2. **Exclude unnecessary content types:**
   ```javascript
   excludeContentTypes: [
     'api::frequently-updated.model',
   ]
   ```

3. **Reduce diff depth:**
   ```javascript
   config: {
     maxDiffDepth: 3, // Lower = faster
   }
   ```

---

## 🔧 Technical Details

### Lifecycle Hook Events

The plugin subscribes to these Strapi lifecycle events:

| Event | When Triggered | Action |
|-------|---------------|--------|
| `beforeUpdate` | Before record update | Capture old state |
| `afterCreate` | After record creation | Log create action |
| `afterUpdate` | After record update | Log update with diff |
| `afterDelete` | After record deletion | Log delete action |
| `afterCreateMany` | After bulk create | Log bulk create |
| `afterUpdateMany` | After bulk update | Log bulk update |
| `afterDeleteMany` | After bulk delete | Log bulk delete |

### Security Features

**1. Automatic Field Exclusion**
- Passwords
- Reset tokens
- Confirmation tokens
- API tokens
- JWT secrets

**2. Configurable Exclusions**
- Custom sensitive fields
- Content types
- User-defined patterns

**3. Request Context Capture**
- User identification
- IP address tracking
- User agent logging
- Source attribution

### Performance Considerations

**1. Indexed Fields**
- `contentType` - Fast filtering by type
- `recordId` - Quick lookup by record
- `action` - Efficient action filtering
- `userId` - User activity queries
- `createdAt` - Time-based queries

**2. Async Operations**
- Audit logging doesn't block main operations
- Errors in logging don't affect content operations
- Graceful degradation

**3. Storage Optimization**
- Only changed fields stored (updates)
- Relations stored as IDs only
- Configurable payload capture

### Database Compatibility

Tested and compatible with:
- ✅ PostgreSQL 12+
- ✅ MySQL 5.7+
- ✅ MariaDB 10.3+
- ✅ SQLite 3 (development only)

### Strapi Version Compatibility

- ✅ Strapi v4.x
- ✅ Strapi v5.x

---

## 📝 Best Practices

### 1. Regular Cleanup

Set up automated cleanup to prevent database bloat:

```bash
# Cron job example (weekly cleanup of 90+ day old logs)
0 2 * * 0 curl -X DELETE 'http://localhost:1337/api/audit-logs/cleanup' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -d '{"olderThan": "'$(date -d '90 days ago' -I)'"}'
```

### 2. Exclude High-Volume Content

Exclude content types that change frequently but don't need auditing:

```javascript
excludeContentTypes: [
  'api::view-count.view-count',
  'api::analytics.analytics',
  'api::session.session',
]
```

### 3. Monitor Storage

Track audit log table size:

```sql
-- PostgreSQL
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));

-- MySQL
SELECT 
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE TABLE_NAME = 'audit_logs';
```

### 4. Export for Compliance

For regulatory compliance, export logs periodically:

```bash
# Export last month's logs
curl -X GET \
  'http://localhost:1337/api/audit-logs?filters[createdAt][$gte]=2025-09-01&filters[createdAt][$lte]=2025-09-30&pagination[pageSize]=1000' \
  -H 'Authorization: Bearer TOKEN' \
  > audit_logs_september_2025.json
```

### 5. Restrict Access

Grant audit log access only to necessary roles:

- ✅ Administrators
- ✅ Security team
- ✅ Compliance officers
- ❌ Regular content editors
- ❌ API consumers

---

## 🤝 Contributing

This plugin is part of a Strapi fork. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT

---

## 💬 Support

For issues, questions, or feature requests:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Strapi documentation: https://docs.strapi.io
3. Create an issue in the repository

---

## 🎉 Credits

Built with ❤️ for Strapi

**Author:** Dheeraj Selvam

---

## 📚 Additional Resources

- [Strapi Documentation](https://docs.strapi.io)
- [Strapi Plugin Development](https://docs.strapi.io/developer-docs/latest/development/plugins-development.html)
- [Strapi Lifecycle Hooks](https://docs.strapi.io/developer-docs/latest/development/backend-customization/models.html#lifecycle-hooks)
- [Strapi RBAC](https://docs.strapi.io/user-docs/latest/users-roles-permissions/introduction-to-users-roles-permissions.html)

---

**Version:** 1.0.0  
**Last Updated:** October 25, 2025