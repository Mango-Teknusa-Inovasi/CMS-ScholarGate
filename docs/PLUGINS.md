# Plugin Development Guide — CMS ScholarGate

This document provides a comprehensive guide to building, structuring, migrating, and distributing modular plugins for **CMS ScholarGate**.

---

## 1. Philosophy & Architecture

CMS ScholarGate adopts a modular, package-like plugin architecture (similar to WordPress and modern Laravel packages):
- **Zero Core Modification**: Add custom institutional capabilities (e.g. PPDB Online, Digital Library, Graduation Checking, WhatsApp/Telegram notifications) without modifying a single line of core CMS code.
- **Complete Isolation**: Each plugin lives in its own self-contained directory under `plugins/<plugin-slug>/`.
- **Hot-Toggleable**: Plugins can be dynamically activated or deactivated instantly via the Admin Dashboard (`/admin/plugins`) or REST API.
- **Hardened Security**: Plugin `.ZIP` uploads are protected against *Zip Slip* (path traversal), malicious files (`.env`, `.phar`, `.htaccess`), and uncompressed quota limits.

---

## 2. Plugin Directory Structure

Every plugin must be placed in `plugins/<plugin-slug>/` following this standard directory structure:

```text
plugins/
└── ppdb-online/
    ├── plugin.json               # [Required] Plugin metadata manifest
    ├── routes/
    │   ├── web.php               # [Optional] Web routes (middleware 'web')
    │   └── api.php               # [Optional] API routes (middleware 'api', prefixed with '/api/v1')
    ├── database/
    │   └── migrations/           # [Optional] Plugin database migrations
    ├── src/
    │   ├── PpdbServiceProvider.php
    │   └── Controllers/
    │       └── PpdbController.php
    └── README.md                 # [Optional] Plugin internal documentation
```

---

## 3. Manifest Specification (`plugin.json`)

The `plugin.json` file is the required manifest located at the root of every plugin directory:

```json
{
  "name": "PPDB Online 2026",
  "slug": "ppdb-online",
  "version": "1.0.0",
  "description": "Integrated Student Admissions Module for ScholarGate CMS.",
  "author": "Mango Teknusa Inovasi",
  "author_url": "https://mangoteknusa.com",
  "provider": "Plugins\\PpdbOnline\\PpdbServiceProvider",
  "icon": "GraduationCap"
}
```

### Manifest Fields:
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | **Yes** | Display name shown in the Admin CMS interface. |
| `slug` | string | **Yes** | Unique identifier (lowercase alphanumeric `a-z`, `0-9`, and hyphens `-` only). Must match the folder name. |
| `version` | string | **Yes** | Semantic version string (e.g., `1.0.0`). |
| `description` | string | No | Short explanation of the plugin's functionality. |
| `author` | string | No | Author or organization name. |
| `author_url` | string | No | Website or repository link of the author. |
| `provider` | string | No | Optional Laravel ServiceProvider class for dependency injection and bindings. |
| `icon` | string | No | Lucide icon name for visual display in the admin panel. |

---

## 4. Plugin Routing (Web & API)

CMS ScholarGate automatically registers route files for any plugin that is marked as **Active**:

### Web Routes (`routes/web.php`)
Loaded into the `web` middleware group (sessions, cookies, and CSRF protection):
```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/ppdb', function () {
    return inertia('Ppdb/Index', [
        'title' => 'PPDB Online Admissions 2026',
    ]);
});
```

### API Routes (`routes/api.php`)
Loaded into the `api` middleware group with the automatic prefix `/api/v1/`:
```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/ppdb/status', function () {
    return response()->json([
        'status' => 'open',
        'quota' => 360,
    ]);
});
// Accessible at: GET /api/v1/ppdb/status
```

---

## 5. Database Isolation & Table Prefixing (Safe Lifecycle)

To ensure the core database remains pristine, stable, and decoupled, ScholarGate enforces strict database isolation rules:

### 🛡️ The Golden Rule: Never Modify Core Tables
1. **NO ALTER TABLE on Core Entities**:
   - Plugins **must not** run `Schema::table('articles', ...)` or `Schema::table('users', ...)`.
   - Modifying core tables creates *dirty schemas*, risks collisions between plugins, and leaves orphaned *zombie columns* when plugins are removed.
2. **MANDATORY Table Prefixing**:
   - All tables created by a plugin **must** be prefixed with the plugin's slug or unique namespace:
     - Plugin `ppdb-online` $\to$ `ppdb_registrations`, `ppdb_documents`, `ppdb_settings`
     - Plugin `elibrary` $\to$ `elibrary_books`, `elibrary_loans`
   - This ensures 100% isolation with zero collisions against core CMS tables or other add-ons.

---

### 🔄 Plugin Lifecycle (Activate, Deactivate, Uninstall)

| Action | Database State | Files & Routes | When to Use |
|---|---|---|---|
| **Activate** | Prefixed tables created via `up()` migration | Routes, hooks, and controllers loaded into memory | When the school enables the feature |
| **Deactivate** | **Tables and physical data preserved** | Routes, hooks, and controllers detached from memory | Temporary maintenance or off-season (prevents data loss) |
| **Uninstall / Delete** | All prefixed tables dropped via `down()` rollback | Files deleted and DB record purged cleanly | Complete removal of the add-on |

---

### 📝 Example Migration Following Isolation Standards

Place migration files in `plugins/<slug>/database/migrations/`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run migrations: create dedicated prefixed tables.
     */
    public function up(): void
    {
        Schema::create('ppdb_registrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('registration_number')->unique();
            $table->string('student_name');
            $table->string('nisn', 10);
            $table->string('origin_school');
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('ppdb_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('registration_id')->constrained('ppdb_registrations')->cascadeOnDelete();
            $table->string('document_type');
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Rollback migrations: drop all prefixed tables cleanly.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppdb_documents');
        Schema::dropIfExists('ppdb_registrations');
    }
};
```

---

### 💡 Attaching Plugin Data to Users or Articles
If your plugin needs to associate data with core entities:
- **Use Dedicated Relational Tables**: Create a relation table like `ppdb_applicant_users` linking `user_id` to `ppdb_registrations.id`.
- **Use Filter Hooks**: Use `Hook::applyFilter('article_content', ...)` to inject custom widgets or registration banners dynamically without altering the `articles` schema.
- **Use JSON Settings**: Store plugin configuration in the `manifest` JSON column of `plugins` or namespaced in `settings` with key `plugin_{slug}_{key}`.

---

## 6. Hook System (Actions & Filters)

ScholarGate provides the `App\Support\Hook` facade for clean, decoupled inter-module communication:

### Action Hook (Event Listener)
```php
use App\Support\Hook;

// Register an action listener
Hook::addAction('article_published', function ($article) {
    \Log::info("New article published: {$article->title}");
}, priority: 10);

// Trigger an action
Hook::doAction('article_published', $article);
```

### Filter Hook (Data Transformer)
```php
use App\Support\Hook;

// Transform content before display
Hook::addFilter('article_content', function (string $content) {
    return $content . '<p class="text-xs text-subtle">Published via Official School Portal.</p>';
}, priority: 10);

// Apply the filter
$content = Hook::applyFilter('article_content', $rawContent);
```

---

## 7. Packaging & Distributing Plugins (.ZIP)

1. Compress the plugin folder into a `.ZIP` archive:
   ```bash
   cd plugins/
   zip -r ppdb-online.zip ppdb-online/
   ```
2. **Security Audit Rules**:
   - Maximum upload size: **20 MB**.
   - Maximum file count: **500 files**.
   - Maximum uncompressed size: **50 MB**.
   - Forbidden files: `.env`, `.htaccess`, `web.config`, `.phar`, `.phtml`.
   - Path traversal attempts (`../`) are automatically rejected.
3. Upload directly via the Admin CMS: **Admin $\to$ Plugins $\to$ Upload Plugin (.ZIP)**.

---

## 8. Quick Tutorial: Building a "Graduation Checker" Plugin

### Step 1: Create Folder & Manifest
Create `plugins/graduation-checker/plugin.json`:
```json
{
  "name": "Graduation Checker",
  "slug": "graduation-checker",
  "version": "1.0.0",
  "description": "Self-service student graduation status inquiry by NISN.",
  "author": "School IT Team",
  "icon": "Award"
}
```

### Step 2: Create API Route
Create `plugins/graduation-checker/routes/api.php`:
```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/graduation/check', function (Request $request) {
    $request->validate(['nisn' => 'required|string']);
    $nisn = $request->input('nisn');

    return response()->json([
        'success' => true,
        'nisn' => $nisn,
        'status' => 'GRADUATED',
        'message' => 'Congratulations, you have officially graduated!',
    ]);
});
```

### Step 3: Activate in Admin
1. Open `/admin/plugins` in your browser.
2. The "Graduation Checker" plugin will be automatically discovered.
3. Click **Activate Module**.
4. The endpoint `POST /api/v1/graduation/check` is immediately live.
