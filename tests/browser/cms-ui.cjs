// Setup: npm run build && npx playwright install chromium && npm run test:ui
// Set PLAYWRIGHT_CHANNEL=chrome to use an installed Chrome instead.
// Browser regression checks use isolated API and Inertia fixtures; no application data is changed.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const root = process.argv[2] || process.cwd();
const phase = process.argv[3] || "after";
const output = path.join(process.cwd(), ".cache/ui-review");
fs.mkdirSync(output, { recursive: true });
const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "public/build/manifest.json")),
);
const entry = manifest["resources/js/app.tsx"];
const user = {
    id: 1,
    name: "Operator Sekolah",
    email: "operator@example.test",
    role: "admin",
    is_admin: true,
    is_super_admin: true,
};
const category = {
    id: 1,
    name: "Kegiatan sekolah",
    slug: "kegiatan",
    color: "#0369a1",
    articles_count: 8,
};
const articles = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: [
        "Belajar bersama untuk masa depan: kegiatan literasi dan kreativitas siswa",
        "Pendaftaran kegiatan ekstrakurikuler semester baru",
        "Prestasi siswa dalam kompetisi sains tingkat provinsi",
    ][i % 3],
    slug: `berita-${i + 1}`,
    excerpt:
        "Informasi kegiatan dan layanan sekolah bagi siswa, orang tua, dan masyarakat.",
    body: "<p>Sekolah mengadakan kegiatan literasi untuk mengembangkan minat baca dan kreativitas siswa.</p><h2>Kegiatan pembelajaran</h2><p>Guru dan siswa berpartisipasi dalam diskusi, membaca bersama, dan mempresentasikan karya mereka.</p>",
    status: i === 1 ? "draft" : "published",
    is_featured: i === 0,
    views: 125 + i,
    published_at: "2026-10-20T08:00:00Z",
    updated_at: "2026-10-24T08:00:00Z",
    category,
    category_id: 1,
    tags: [],
    cover_path: "/fixture.png",
}));
let settings = {
    site_name: "SMA ScholarGate",
    school_name: "SMA ScholarGate",
    site_title: "SMA ScholarGate",
    site_description: "Portal informasi sekolah",
    report_url: "",
    widget_announcement_enabled: "0",
};
const menus = {
    header: [
        { id: 1, label: "Beranda", url: "/" },
        {
            id: 2,
            label: "Profil",
            url: "/profil",
            children: [
                { id: 21, label: "Tentang sekolah", url: "/profil" },
                { id: 22, label: "Kontak", url: "/profil#kontak" },
                {
                    id: 23,
                    label: "Dokumen eksternal",
                    url: "https://example.test/dokumen",
                    open_in_new_tab: true,
                },
            ],
        },
        { id: 3, label: "Artikel", url: "/artikel" },
        { id: 4, label: "Prestasi", url: "/prestasi" },
        { id: 5, label: "Unduhan", url: "/download" },
    ],
    footer: [],
};
const home = {
    banners: [
        {
            id: 1,
            title: "Selamat datang di SMA ScholarGate",
            subtitle: "Informasi dan layanan sekolah untuk siswa dan orang tua",
            image_path: "/fixture.png",
            cta_label: "Baca berita sekolah",
            cta_url: "/artikel",
        },
    ],
    welcome: {
        title: "Sambutan kepala sekolah",
        body: "Selamat datang di portal sekolah. Temukan informasi kegiatan, layanan pendidikan, dan prestasi siswa.",
        image_path: "/fixture.png",
    },
    services: [
        {
            id: 1,
            title: "Pendaftaran siswa",
            description: "Informasi penerimaan siswa baru",
            icon: "file-text",
            link_url: "/profil",
        },
        {
            id: 2,
            title: "Dokumen sekolah",
            description: "Berkas dan formulir",
            icon: "download",
            link_url: "/download",
        },
    ],
    articles,
    achievements: [],
    gallery: [],
    partners: [],
};
const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=",
    "base64",
);
let theme = "default",
    role = "admin",
    fail = "",
    empty = false;
const mutations = [];
const errors = [];
const results = [];
function pageData(url) {
    const p = new URL(url).pathname;
    let component = "HomePage";
    let params = {};
    if (p === "/admin") component = "admin/DashboardPage";
    else if (p === "/admin/articles") component = "admin/ArticlesAdminPage";
    else if (
        p === "/admin/articles/new" ||
        /^\/admin\/articles\/\d+\/edit/.test(p)
    ) {
        component = "admin/ArticleEditorPage";
        params = p.endsWith("/new") ? {} : { id: p.split("/")[3] };
    } else if (p === "/admin/media") component = "admin/MediaLibraryPage";
    else if (p === "/admin/settings") component = "admin/SettingsAdminPage";
    else if (p === "/artikel") component = "ArticlesPage";
    else if (p.startsWith("/artikel/")) {
        component = "ArticleDetailPage";
        params = { slug: p.split("/")[2] };
    } else if (p === "/profil") component = "ProfilePage";
    else if (p === "/download") component = "DownloadsPage";
    const authUser =
        role === "guest"
            ? null
            : {
                  ...user,
                  role,
                  is_admin: role !== "member",
                  is_super_admin: role === "admin",
              };
    return {
        component,
        url: p + new URL(url).search,
        version: "ui-review",
        clearHistory: false,
        encryptHistory: false,
        props: {
            errors: {},
            auth: { user: authUser },
            params,
            ...params,
            active_theme: theme,
            app: { name: "SMA ScholarGate" },
            hooks: {},
        },
    };
}
async function serve(route) {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    if (p.startsWith("/build/")) {
        const f = path.join(root, "public", p);
        if (fs.existsSync(f))
            return route.fulfill({
                body: fs.readFileSync(f),
                contentType: f.endsWith(".css")
                    ? "text/css"
                    : "application/javascript",
            });
    }
    if (req.resourceType() === "image")
        return route.fulfill({ body: png, contentType: "image/png" });
    if (p.startsWith("/api/v1/")) {
        const e = p.slice(7);
        let data = {};
        if (fail === e)
            return route.fulfill({
                status: 503,
                json: { message: "Fixture failure" },
            });
        if (req.method() !== "GET") {
            mutations.push({
                endpoint: e,
                method: req.method(),
                body: req.postDataJSON(),
            });
            if (e === "/admin/settings")
                settings = { ...settings, ...req.postDataJSON() };
            if (e === "/admin/articles/1")
                Object.assign(articles[0], req.postDataJSON());
            return route.fulfill({
                json: e.includes("/articles")
                    ? {
                          ...articles[0],
                          id: 1,
                          preview_url: "/artikel/berita-1",
                          path: "/artikel/berita-1",
                      }
                    : { ok: true },
            });
        }
        if (e === "/auth/me")
            data = {
                user:
                    role === "guest"
                        ? null
                        : {
                              ...user,
                              role,
                              is_admin: role !== "member",
                              is_super_admin: role === "admin",
                          },
            };
        else if (e === "/settings/public" || e === "/admin/settings")
            data = settings;
        else if (e === "/menus") data = menus;
        else if (e === "/home")
            data = empty
                ? {
                      ...home,
                      articles: [],
                      banners: [],
                      welcome: null,
                      services: [],
                  }
                : home;
        else if (e === "/admin/dashboard")
            data = {
                stats: {
                    articles_published: 7,
                    articles_draft: 1,
                    categories: 1,
                    banners_active: 1,
                    downloads: 3,
                    total_views: 1450,
                },
                recent_articles: articles.slice(0, 5),
            };
        else if (e === "/admin/articles")
            data = {
                data:
                    empty || url.searchParams.get("q") === "tidakada"
                        ? []
                        : articles.filter(
                              (a) =>
                                  !url.searchParams.get("status") ||
                                  a.status === url.searchParams.get("status"),
                          ),
            };
        else if (/^\/admin\/articles\/\d+$/.test(e)) data = articles[0];
        else if (e === "/admin/categories" || e === "/categories")
            data = [category];
        else if (e === "/admin/tags") data = [];
        else if (e === "/admin/media-library" || e === "/admin/media")
            data = {
                data: empty
                    ? []
                    : [
                          {
                              id: 1,
                              filename: "sekolah.png",
                              original_filename: "sekolah.png",
                              original_name: "sekolah.png",
                              file_name: "sekolah.png",
                              path: "/fixture.png",
                              url: "/fixture.png",
                              mime: "image/png",
                              size: 1200,
                              width: 1200,
                              height: 600,
                              alt: "Sekolah",
                              created_at: "2026-10-20",
                          },
                      ],
            };
        else if (e === "/articles")
            data = {
                featured: articles[0],
                articles: {
                    data: articles,
                    current_page: 1,
                    last_page: 1,
                    total: 8,
                },
                sidebar: {
                    summary: { total_articles: 8, total_categories: 1 },
                    categories: [category],
                    popular: articles.slice(0, 3),
                },
            };
        else if (e.startsWith("/articles/"))
            data = {
                article: articles[0],
                related: articles.slice(1, 3),
                sidebar: {
                    categories: [category],
                    popular: articles.slice(1, 3),
                },
            };
        else if (e === "/downloads") data = [];
        else if (e.startsWith("/seo/")) data = {};
        return route.fulfill({ json: data });
    }
    if (req.resourceType() === "document" || req.headers()["x-inertia"]) {
        const data = pageData(req.url());
        if (req.headers()["x-inertia"])
            return route.fulfill({
                headers: { "X-Inertia": "true" },
                json: data,
            });
        return route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${entry.css.map((f) => `<link rel="stylesheet" href="/build/${f}">`).join("")}</head><body><script data-page="app" type="application/json">${JSON.stringify(data)}</script><div id="app" data-page='${JSON.stringify(data).replace(/'/g, "&#39;")}'></div><script type="module" src="/build/${entry.file}"></script></body></html>`,
        });
    }
    return route.fulfill({ status: 204, body: "" });
}
(async () => {
    const browser = await chromium.launch(
        process.env.PLAYWRIGHT_CHANNEL
            ? { channel: process.env.PLAYWRIGHT_CHANNEL }
            : {},
    );
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route("**/*", serve);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("BROWSER", e.message);
    });
    async function go(url) {
        if (process.env.UI_DEBUG) console.log("Visit", url);
        await page.goto("http://cms.test" + url);
        await page.waitForTimeout(700);
        if (!(await page.locator("#app").innerText()).trim())
            throw new Error("Empty render: " + errors.join(";"));
    }
    for (const width of process.env.UI_SKIP_SCREENSHOTS ? [] : [375, 768, 1440])
        for (const dark of [false, true])
            for (const target of [
                { url: "/admin", name: "dashboard", theme: "default" },
                { url: "/admin/articles", name: "articles", theme: "default" },
                {
                    url: "/admin/articles/1/edit",
                    name: "editor",
                    theme: "default",
                },
                { url: "/", name: "home", theme: "default" },
                { url: "/", name: "classic-home", theme: "classic" },
                { url: "/artikel/berita-1", name: "detail", theme: "default" },
                {
                    url: "/artikel/berita-1",
                    name: "classic-detail",
                    theme: "classic",
                },
            ]) {
                theme = target.theme;
                role = "admin";
                await page.setViewportSize({ width, height: 900 });
                await page.emulateMedia({
                    colorScheme: dark ? "dark" : "light",
                });
                await go(target.url);
                await page.evaluate((d) => {
                    document.documentElement.classList.toggle("dark", d);
                    localStorage.setItem(
                        "scholargate_theme_mode",
                        d ? "dark" : "light",
                    );
                }, dark);
                await page.waitForTimeout(100);
                const metrics = await page.evaluate(() => ({
                    overflow:
                        document.documentElement.scrollWidth > innerWidth + 1,
                    width: document.documentElement.scrollWidth,
                    headings: [...document.querySelectorAll("h1")].map(
                        (x) => x.textContent,
                    ),
                    body: document.body.innerText.length,
                }));
                results.push({ width, dark, page: target.name, ...metrics });
                await page.screenshot({
                    path: `${output}/${phase}-${target.name}-${width}-${dark ? "dark" : "light"}.png`,
                    fullPage: true,
                });
            }
    fs.writeFileSync(
        `${output}/${phase}${process.env.UI_SKIP_SCREENSHOTS ? "-interactions" : ""}-results.json`,
        JSON.stringify({ results, errors, mutations }, null, 2),
    );
    if (phase === "after") {
        theme = "default";
        role = "admin";
        await page.setViewportSize({ width: 1440, height: 900 });
        await go("/admin");
        assert(
            await page
                .getByRole("link", { name: "Artikel", exact: true })
                .first()
                .isVisible(),
        );
        await page
            .getByRole("link", { name: "Artikel", exact: true })
            .first()
            .click();
        await page.waitForTimeout(400);
        assert(page.url().endsWith("/admin/articles"));
        await page.goBack();
        await page
            .getByRole("heading", { name: "Dashboard", exact: true })
            .waitFor();
        await page.goForward();
        await page
            .getByRole("heading", { name: "Artikel", exact: true })
            .waitFor();
        assert(
            await page
                .getByRole("navigation", { name: "Breadcrumb" })
                .innerText()
                .then((t) => t.includes("Utama")),
        );
        await page.getByLabel("Cari judul artikel").fill("tidakada");
        await page.getByText("Tidak ada artikel yang sesuai").waitFor();
        await page.getByRole("button", { name: "Hapus filter" }).click();
        await page.getByLabel("Pilih semua artikel").check();
        await page.getByRole("button", { name: "Batal", exact: true }).click();
        await page.getByLabel("Filter status artikel").selectOption("draft");
        await page.waitForFunction(
            () => document.querySelectorAll("tbody tr").length === 1,
        );
        await go("/admin/articles/1/edit");
        await page
            .getByRole("button", { name: /Simpan draf/i })
            .first()
            .click();
        await page.waitForTimeout(300);
        assert(mutations.some((m) => m.endpoint === "/admin/articles/1"));
        await go("/admin/articles/1/edit");
        await page
            .getByRole("button", {
                name: "Pilih dari Pustaka Media",
                exact: true,
            })
            .click();
        await page.getByRole("dialog").waitFor();
        await page.getByTitle("sekolah.png (Dobel klik untuk memilih)").click();
        await page
            .getByRole("button", { name: "Gunakan Media Ini" })
            .last()
            .click();
        if (process.env.UI_DEBUG) console.log("Media selected");
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await page
            .getByRole("button", { name: "Pratinjau", exact: true })
            .click();
        await page.waitForTimeout(350);
        assert(
            mutations.some(
                (m) => m.endpoint === "/admin/articles/1/preview-token",
            ),
        );
        await go("/admin/articles");
        await page
            .locator("tbody")
            .getByRole("button", { name: "Sampah", exact: true })
            .first()
            .click();
        await page
            .getByRole("button", { name: "Ya, pindahkan", exact: true })
            .click();
        await page.waitForTimeout(250);
        assert(
            mutations.some(
                (m) =>
                    m.method === "DELETE" && m.endpoint === "/admin/articles/1",
            ),
        );
        await page
            .getByRole("button", { name: "Sampah", exact: true })
            .first()
            .click();
        await page
            .getByRole("button", { name: "Pulihkan", exact: true })
            .first()
            .click();
        await page.waitForTimeout(250);
        assert(
            mutations.some((m) => m.endpoint === "/admin/articles/1/restore"),
        );
        await go("/admin/articles/new");
        await page
            .getByRole("textbox", { name: "Judul artikel", exact: true })
            .fill("Artikel uji baru");
        await page
            .getByRole("button", { name: "Simpan draf", exact: true })
            .click();
        await page.waitForTimeout(250);
        assert(
            mutations.some(
                (m) => m.method === "POST" && m.endpoint === "/admin/articles",
            ),
        );
        await go("/admin/settings");
        await page
            .getByRole("button", { name: "Simpan Semua Perubahan" })
            .click();
        await page.waitForTimeout(250);
        assert(mutations.some((m) => m.endpoint === "/admin/settings"));
        await page.setViewportSize({ width: 375, height: 900 });
        await go("/admin");
        const trigger = page.getByRole("button", {
            name: "Buka menu",
            exact: true,
        });
        await trigger.click();
        await page.getByRole("dialog", { name: "Navigasi admin" }).waitFor();
        assert(
            (await page.evaluate(() => document.body.style.overflow)) ===
                "hidden",
        );
        await page.keyboard.press("Shift+Tab");
        assert(
            await page
                .getByRole("dialog")
                .getByRole("button", { name: "Keluar", exact: true })
                .evaluate((e) => document.activeElement === e),
        );
        await page.keyboard.press("Tab");
        assert(
            await page
                .getByRole("dialog")
                .getByRole("link")
                .first()
                .evaluate((e) => document.activeElement === e),
        );
        await page.keyboard.press("Escape");
        await page.waitForTimeout(350);
        assert(await trigger.evaluate((e) => document.activeElement === e));
        assert(
            (await page.evaluate(() => document.body.style.overflow)) !==
                "hidden",
        );
        role = "editor";
        await go("/admin");
        await page
            .getByRole("button", { name: "Buka menu", exact: true })
            .click();
        await page.getByRole("button", { name: "Sistem", exact: true }).click();
        assert(
            (await page
                .getByRole("dialog")
                .getByRole("link", { name: "Pengguna", exact: true })
                .count()) === 0,
        );
        assert(
            (await page
                .getByRole("dialog")
                .getByRole("link", { name: "Cadangan", exact: true })
                .count()) === 0,
        );
        role = "guest";
        await go("/");
        await page
            .getByRole("button", { name: "Buka menu", exact: true })
            .click();
        await page.getByRole("button", { name: "Submenu Profil" }).click();
        assert(
            await page
                .getByRole("link", { name: "Kontak", exact: true })
                .isVisible(),
        );
        assert(
            (await page
                .getByRole("link", { name: "Dokumen eksternal" })
                .getAttribute("target")) === "_blank",
        );
        assert(
            (await page
                .getByRole("link", { name: "Lapor", exact: true })
                .count()) === 0,
        );
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
        await page.setViewportSize({ width: 1440, height: 900 });
        await go("/");
        await page.getByRole("button", { name: "Submenu Profil" }).focus();
        await page.keyboard.press("Enter");
        assert(
            await page
                .getByRole("link", { name: "Tentang sekolah" })
                .isVisible(),
        );
        await page.keyboard.press("Escape");
        assert(
            await page
                .getByRole("button", { name: "Submenu Profil" })
                .evaluate((e) => document.activeElement === e),
        );
        theme = "classic";
        role = "member";
        await go("/");
        assert(
            (await page
                .getByRole("link", { name: /Operator Sekolah/ })
                .getAttribute("href")) === "/akun",
        );
        theme = "default";
        role = "admin";
        fail = "/admin/articles";
        await go("/admin/articles");
        await page
            .getByText("Data belum dapat dimuat")
            .waitFor({ timeout: 15000 });
        fail = "";
        await page
            .getByRole("button", { name: "Coba lagi", exact: true })
            .click();
        await page.locator("tbody tr").first().waitFor();
        empty = true;
        await go("/admin/articles");
        assert(
            await page
                .getByText("Belum ada artikel", { exact: true })
                .isVisible(),
        );
        empty = false;
    }
    fs.writeFileSync(
        `${output}/${phase}${process.env.UI_SKIP_SCREENSHOTS ? "-interactions" : ""}-results.json`,
        JSON.stringify({ results, errors, mutations }, null, 2),
    );
    console.log(
        JSON.stringify(
            {
                phase,
                screenshots: results.length,
                overflows: results.filter((r) => r.overflow),
                errors,
                mutations: mutations.length,
            },
            null,
            2,
        ),
    );
    await browser.close();
    if (errors.length || results.some((r) => r.overflow || r.body < 30))
        process.exitCode = 1;
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
