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
└── classic/                         # Classic News Portal Theme (Polos Putih Model News Website)
    ├── theme.json
    ├── layout/
    │   └── ClassicLayout.tsx        # Custom Theme Layout Wrapper
    └── pages/
        ├── HomePage.tsx             # Classic Multi-Column News Portal Landing Page
        ├── ArticlesPage.tsx         # Classic News Feed Page
        ├── ArticleDetailPage.tsx    # Classic Single Article Detail Page
        ├── AchievementsPage.tsx     # Classic Student Achievements Grid
        ├── ExtracurricularPage.tsx  # Classic Club & Extracurricular Directory
        ├── DownloadsPage.tsx        # Classic Downloads Directory
        └── ProfilePage.tsx          # Classic School Profile Page
```

---

## 📝 1. Theme Manifest (`theme.json`)

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

---

## 🏛️ 2. Critical Guidelines: Zero Hardcoding & Dynamic Branding

To maintain enterprise security, multi-institution compatibility, and clean code standards:

1. **NO Hardcoded Institution Data**:
   - Never hardcode institution names, emails, phone numbers, addresses, or logos in TSX components.
   - Use shared Inertia props provided by `HandleInertiaRequests.php`:
     ```tsx
     const { props } = usePage<{
         app?: {
             name?: string;
             logo_url?: string | null;
             tagline?: string;
             email?: string;
             phone?: string;
             address?: string;
         }
     }>();

     const siteName = props.app?.name || 'Portal Resmi';
     const logoUrl = props.app?.logo_url;
     const tagline = props.app?.tagline;
     ```

2. **Dynamic Logo Rendering**:
   - Check if `logo_url` exists. If present, render the uploaded branding logo `<img src={logoUrl} alt={siteName} />`. Fallback to an icon only if `logo_url` is `null`.

3. **Dynamic API & Data Fetching**:
   - Fetch live portal data (articles, achievements, extracurriculars, downloads) using TanStack Query (`@tanstack/react-query`) calling `/api/v1/*` endpoints or Inertia page props.
   - Safe HTML rendering: Always render article content with `<SafeHtml html={article.body_html} />` or DOMPurify.

---

## ⚛️ 3. Developing Theme Pages (`pages/*.tsx`)

Theme pages are React 19 components using Inertia.js props.

### 🛡️ Automatic Fallback Mechanism
If your custom theme does **not** provide a specific page (e.g., your theme only customizes `HomePage.tsx`), ScholarGate's dynamic Inertia resolver in `resources/js/app.tsx` automatically falls back to `themes/default/pages/` for any missing pages.

### Example: Creating a Custom `HomePage.tsx`

```tsx
import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ClassicLayout from '../layout/ClassicLayout';
import { HookSlot } from '@/components/ui/HookSlot';
import { SafeHtml } from '@/components/ui/SafeHtml';

export default function ClassicHomePage() {
    const { props } = usePage<{ app?: { name?: string } }>();
    const siteName = props.app?.name || 'Portal Resmi';

    return (
        <ClassicLayout>
            <Head title={`Beranda Utama — ${siteName}`} />

            <HookSlot name="after_navbar" />

            <main className="max-w-7xl mx-auto py-8">
                {/* Your Custom Theme Components */}
            </main>

            <HookSlot name="before_footer" />
        </ClassicLayout>
    );
}
```

---

## 🔌 4. Supporting Plugin Hooks (`<HookSlot />`)

Place `<HookSlot />` components at strategic positions in your theme layout to enable plugin widgets:

```tsx
import { HookSlot } from '@/components/ui/HookSlot';

<HookSlot name="after_navbar" />
<HookSlot name="home_bento" />
<HookSlot name="before_footer" />
```

---

## 📦 5. Packaging & Installing Themes

1. Compress your theme folder into a `.zip` archive (containing `theme.json` and `pages/`).
2. Log in to the Admin Panel as a **Super Admin**.
3. Navigate to **Sistem -> Tema & Layout** (`/admin/themes`).
4. Click **Unggah Tema (.ZIP)** and select your archive.
5. Click **Aktifkan Tema** to switch the active theme instantly!

