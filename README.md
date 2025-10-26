# Audit Log Feature for Strapi 🕵️

## 🚀 Overview

This feature integrates automated **audit logging** for all content changes made via Strapi's Content API. It systematically captures **create**, **update**, and **delete** operations across *all* configured content types, providing a clear history of data modifications essential for compliance, security, and debugging.

---

## ✨ Key Features

The audit log feature provides robust tracking and querying capabilities:

* **Dedicated Collection:** All content changes are logged into a dedicated collection named `audit_logs`.
* **Detailed Log Data:** Each log entry captures:
    * **`contentType`** and the **record ID** that was modified.
    * **`action`** performed (`create`, `update`, or `delete`).
    * **Timestamp** of the operation.
    * **`userId`** of the authenticated user who initiated the change (if applicable).
    * The **changed fields** or the **full payload** of the modification.
* **REST API Endpoint:** Access the logs via the dedicated endpoint: `/api/audit-logs`.
* **Advanced Querying:** The API endpoint supports:
    * **Filtering** by `contentType`, `userId`, `action`, and date range.
    * **Pagination** and **sorting** for efficient data retrieval.
* **Security (Role-Based Access Control):** Access is restricted. Only users possessing the specific **`read_audit_logs`** permission can access the endpoint.
* **Flexible Configuration:** Control the feature's behavior:
    * `auditLog.enabled`: A global flag to **enable or disable** logging entirely.
    * `auditLog.excludeContentTypes`: An **array of content types** to explicitly ignore and prevent logging for.

---

## 🛠️ Installation / Integration

To integrate this feature into your Strapi project:

1.  **Copy Files:** Place the `audit-log` feature files into your Strapi main repository structure, for example, under:
    ```bash
    packages/strapi/src/plugins/audit-log/
    ```

2.  **Register Plugin:** Ensure the feature is correctly registered as a plugin in your main Strapi configuration file, typically `strapi-server.js`:

    ```javascript
    const auditLog = require('./plugins/audit-log/strapi-server');

    module.exports = {
      // ... other configurations
      plugins: {
        // ... existing plugins
        auditLog, // Register the auditLog plugin
      },
    };
    ```

3.  **Build and Run Strapi:** Navigate to the main repository root, install dependencies, and run the build/development commands:

    ```bash
    npm install
    npm run build
    npm run develop
    ```

---

## 📖 Usage

### Automatic Logging

Audit logs are automatically created anytime a content record is created, updated, or deleted through the Content API.

### Fetching Audit Logs via API

Retrieve the audit logs using a `GET` request with the necessary authorization:

```http
GET /api/audit-logs
Authorization: Bearer <admin-jwt-token>