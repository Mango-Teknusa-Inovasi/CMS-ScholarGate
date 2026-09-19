# 🎨 ScholarGate CMS — Theme Development Guide

ScholarGate CMS features a **Dual Theme & Hook Engine**. Themes control the overall visual layout, typography, and page structure of the public portal (`resources/js/themes/{theme_slug}/`), while **Plugin Hooks** allow add-ons to inject smaller widgets or components into `<HookSlot />` locations across any active theme.

---

## 📁 Theme Directory & File Structure

Each theme resides inside its own folder under `resources/js/themes/`:

```text
resources/js/themes/
├── default/                         # Bento Grid (Default) Theme
│   ├── theme.json                   # Theme Manifest (Metadata)
│   └── pages/                       # Inertia React Page Components
│       ├── HomePage.tsx             # Home / Portal Landing View
│       ├── ArticlesPage.tsx         # Articles Listing
│       ├── ArticleDetailPage.tsx    # Article Detail View
│       ├── AchievementsPage.tsx     # Achievements Directory
│       ├── ExtracurricularPage.tsx  # Extracurricular Directory
│       ├── DownloadsPage.tsx        # Downloads & Files Page
│       └── ProfilePage.tsx          # School Profile View
│
└── classic/                         # Classic News Portal Theme
    ├── theme.json
    └── pages/
        └── HomePage.tsx             # Overrides HomePage with Classic News Layout
```

---

## 📝 1. Creating the Theme Manifest (`theme.json`)

Every theme **must** include a `theme.json` file in its root folder:

```json
{
  "name": "Classic News Portal",
  "slug": "classic",
  "version": "1.0.0",
  "author": "ScholarGate Community",
  "description": "Clean, traditional white news portal layout with multi-column story feed and official announcements.",
  "screenshot": "/favicon.svg",
  "supported_slots": ["after_navbar", "before_footer", "home_bento"]
}
```

### Manifest Schema Attributes:
| Attribute | Type | Description |
|---|---|---|
| `name` | `string` | Display name of your theme in the Admin Panel |
| `slug` | `string` | Unique folder slug (alphanumeric, e.g. `classic`, `modern`) |
| `version` | `string` | Semantic version number (e.g. `1.0.0`) |
| `author` | `string` | Author or organization name |
| `description` | `string` | Concise description of the theme's visual style |
| `supported_slots` | `array` | List of `<HookSlot />` names supported by this theme |

---

## ⚛️ 2. Developing Theme Pages (`pages/*.tsx`)

Theme pages are React 19 components using Inertia.js props.

### 🛡️ Automatic Fallback Mechanism
If your custom theme does **not** provide a specific page (e.g., your theme only customizes `HomePage.tsx`), ScholarGate's dynamic Inertia resolver in `resources/js/app.tsx` automatically falls back to `themes/default/pages/` for any missing pages. You only need to create the pages you want to customize!

### Example: Creating a Custom `HomePage.tsx`

```tsx
import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/components/layout/PublicLayout';
import { HookSlot } from '@/components/ui/HookSlot';

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_url: string | null;
    published_at: string | null;
}

interface HomePageProps {
    articles?: Article[];
    latest_articles?: Article[];
}

export default function MyCustomHomePage({ articles = [], latest_articles = [] }: HomePageProps) {
    const { props } = usePage<{ app?: { name?: string } }>();
    const siteName = props.app?.name || 'Portal Resmi';

    return (
        <PublicLayout>
            <Head title={`Beranda — ${siteName}`} />

            {/* Custom Theme Header */}
            <header className="bg-white border-b p-8 text-center">
                <h1 className="text-3xl font-bold">{siteName}</h1>
            </header>

            {/* Hook Slot for Plugin Widget Injections */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <HookSlot name="after_navbar" />
            </div>

            {/* Article Content Grid */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Your Custom Layout HTML */}
            </main>

            {/* Footer Hook Slot */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <HookSlot name="before_footer" />
            </div>
        </PublicLayout>
    );
}
```

---

## 🔌 3. Supporting Plugin Hooks (`<HookSlot />`)

To ensure your theme is compatible with installed plugins (such as notification bars, chatbot widgets, or custom footers), place `<HookSlot />` components at strategic positions in your layout:

```tsx
import { HookSlot } from '@/components/ui/HookSlot';

// Available standard slot names:
<HookSlot name="after_navbar" />
<HookSlot name="home_bento" />
<HookSlot name="before_footer" />
```

---

## 📦 4. Packaging & Installing Themes

1. Compress your theme folder into a `.zip` archive (containing `theme.json` and `pages/`).
2. Log in to the Admin Panel as a **Super Admin**.
3. Navigate to **Sistem -> Tema & Layout** (`/admin/themes`).
4. Click **Unggah Tema (.ZIP)** and select your archive.
5. Click **Aktifkan Tema** to switch the active theme instantly!
