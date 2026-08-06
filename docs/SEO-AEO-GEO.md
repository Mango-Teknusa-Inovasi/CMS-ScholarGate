# SEO · AEO · GEO

**Language:** English  

Goal: **Google-indexable** pages + easy **Search Console** setup.

## Automatic endpoints

| URL | Role |
|-----|------|
| `/sitemap.xml` | Indexable URLs (home, pages, published articles, achievements) |
| `/robots.txt` | Allow public; disallow admin, API, install, update, login, preview |
| `/llms.txt` | Text map for AI / answer engines (AEO) |

Meta (title, description, canonical, OG, GEO, JSON-LD, GSC verification) is injected:

- **Server** (`app.blade.php` + `seo` props) → bots & GSC
- **Client** (`SeoHead` / `BrandIcons`) → after Inertia navigations

## Google Search Console (3 steps)

1. [Search Console](https://search.google.com/search-console) → add property (`https://your-domain.example`).
2. HTML tag verification → paste into **Admin → Settings → Google Search Console** → Save.  
   Full `<meta …>` tags are accepted; the CMS extracts `content="..."`.
3. **Sitemaps** → submit `https://your-domain.example/sitemap.xml`.

Verify in page source: `google-site-verification`.

## Admin fields that matter

**Settings**

| Field | Why |
|-------|-----|
| Site name + description | Default title/description |
| Logo (auto favicon) + default OG | Social + schema |
| Address, city, lat/lng | Local GEO + Organization schema |
| Phone / email | NAP + ContactPoint |
| GSC / Bing verification | Search property ownership |

**Articles**

- Meta title / description (or excerpt)
- Cover → `og:image`
- FAQ items → FAQPage schema (**AEO**)
- Avoid `noindex` except private drafts

## Index rules (automatic)

| Rule | Detail |
|------|--------|
| Article `noindex` | Excluded from sitemap |
| Admin / login / preview | `noindex` + robots Disallow |
| Canonical | Per page and article |
| Schema | Organization, WebSite, NewsArticle, FAQ, Breadcrumb |
| hreflang | `id` + `x-default` |

## Go-live SEO checklist

- [ ] `APP_URL=https://production-domain` (no trailing slash)
- [ ] GSC verified
- [ ] Sitemap submitted
- [ ] Lat/lng + address filled
- [ ] Several published articles with excerpt + cover
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) on one article

## Notes

No WordPress plugins required. Full SSR frameworks are not required for GSC — verification meta is in the initial HTML. Inertia remains the delivery model for the app UI.
