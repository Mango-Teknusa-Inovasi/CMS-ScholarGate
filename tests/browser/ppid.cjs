// Requires the isolated PPID fixture described in docs/PPID.md. Never use against production.
const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('assert');
const base = process.env.PPID_TEST_URL || 'http://127.0.0.1:8137';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use an isolated local test server.');
const output = '.cache/ppid-review';
fs.mkdirSync(output, { recursive: true });
const errors = [];
async function capture(page, name) {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/${name}-${width}.png`, animations: 'disabled' });
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `Page overflow: ${name} ${width}`);
  }
}
async function login(page, email) {
  await page.goto(`${base}/admin/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('PpidTestOnly2026!');
  await page.getByRole('button', { name: /Masuk/ }).click();
  await page.waitForURL(url => url.pathname === '/admin' || url.pathname === '/admin/ppid');
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const admin = await browser.newPage(); admin.on('pageerror', e => errors.push(e.message));
    await login(admin, 'ppid-test@example.test');
    await admin.goto(`${base}/admin/ppid`);
    await admin.getByRole('heading', { name: 'Ringkasan', exact: true }).waitFor();
    await capture(admin, 'admin');
    await admin.goto(`${base}/admin/ppid/informasi/new`);
    await admin.getByLabel('Judul informasi *', { exact: true }).fill('Dokumen DIP uji browser dengan judul panjang untuk memastikan informasi tetap terbaca pada layar ponsel');
    await admin.getByLabel('Ringkasan', { exact: true }).fill('Dokumen verifikasi unggah manual dan penerbitan.');
    fs.writeFileSync(`${output}/sample.txt`, 'Dokumen DIP untuk pengujian browser.');
    await admin.locator('input[type=file]').setInputFiles(`${output}/sample.txt`);
    await capture(admin, 'editor');
    await admin.getByRole('button', { name: 'Simpan draf dan unggah' }).click();
    await admin.waitForURL(/\/admin\/ppid\/informasi\/[0-9a-f-]+$/);
    await admin.getByRole('button', { name: 'Terbitkan versi ini' }).click();
    await admin.getByText('Informasi berhasil diterbitkan.').waitFor();
    const documentId = new URL(admin.url()).pathname.split('/').pop();
    await admin.getByRole('link', { name: 'Lihat versi publik' }).click();
    await admin.getByRole('link', { name: /Unduh sample.txt/ }).waitFor();
    const fileUrl = await admin.getByRole('link', { name: /Unduh sample.txt/ }).getAttribute('href');
    const download = await admin.request.get(fileUrl);
    assert.equal(download.status(), 200); assert((await download.text()).includes('Dokumen DIP'));
    await capture(admin, 'detail');
    console.log('Manual upload, publication, download and detail: passed');

    for (const theme of ['default', 'classic']) {
      await admin.goto(`${base}/admin/ppid`);
      const response = await admin.evaluate(async (theme) => {
        const csrf = decodeURIComponent(document.cookie.split('; ').find(x => x.startsWith('XSRF-TOKEN='))?.split('=').slice(1).join('=') || '');
        const r = await fetch(`/api/v1/admin/themes/${theme}/activate`, { method: 'POST', headers: { 'X-XSRF-TOKEN': csrf, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }); return r.status;
      }, theme);
      assert.equal(response, 200);
      for (const dark of [false, true]) {
        await admin.goto(`${base}/ppid`);
        await admin.getByRole('heading', { name: 'PPID Sekolah Uji', exact: true }).waitFor();
        await admin.evaluate(dark => { document.documentElement.classList.toggle('dark', dark); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, dark);
        await capture(admin, `${theme}-${dark ? 'dark' : 'light'}`);
      }
    }
    console.log('Both themes, light/dark, 375/768/1440: passed');

    const guest = await browser.newPage(); guest.on('pageerror', e => errors.push(e.message));
    await guest.goto(`${base}/ppid/formulir/request`);
    await guest.getByLabel('Nama lengkap *', { exact: true }).fill('Pemohon Uji');
    await guest.getByLabel('Email *', { exact: true }).fill('pemohon@example.test');
    await guest.getByLabel('Nomor telepon *', { exact: true }).fill('081234567890');
    await guest.getByLabel('Alamat *', { exact: true }).fill('Alamat pengujian');
    await guest.getByLabel('Pekerjaan *', { exact: true }).fill('Guru');
    await guest.getByLabel('Kategori pemohon *', { exact: true }).selectOption('Perorangan');
    await guest.locator('input[type=file]').setInputFiles(`${output}/sample.txt`);
    await capture(guest, 'request');
    await guest.getByRole('button', { name: 'Lanjutkan' }).click();
    await guest.getByLabel('Kategori informasi *', { exact: true }).selectOption('Informasi umum');
    await guest.getByLabel('Rincian informasi yang dibutuhkan *', { exact: true }).fill('Rincian anggaran dan kegiatan sekolah');
    await guest.getByLabel('Tujuan penggunaan informasi *', { exact: true }).fill('Penelitian pendidikan');
    await guest.getByRole('button', { name: 'Lanjutkan' }).click();
    await guest.getByLabel('Cara memperoleh informasi *', { exact: true }).selectOption('Mendapatkan salinan');
    await guest.getByLabel('Cara mendapatkan salinan *', { exact: true }).selectOption('Email');
    await guest.getByRole('button', { name: 'Lanjutkan' }).click();
    await guest.getByRole('checkbox').check();
    const sent = guest.waitForResponse(r => r.url().endsWith('/ppid/submit/request') && r.request().method() === 'POST');
    await guest.getByRole('button', { name: 'Kirim formulir' }).click();
    const response = await sent; assert.equal(response.status(), 201, await response.text()); const receipt = await response.json();
    await guest.getByRole('link', { name: 'Lacak permohonan', exact: true }).click();
    await guest.getByLabel('Nomor register', { exact: true }).fill(receipt.register);
    await guest.getByLabel('Kode akses', { exact: true }).fill(receipt.access_code);
    const unlocked = guest.waitForResponse(r => r.url().endsWith('/ppid/unlock'));
    await guest.getByRole('button', { name: 'Lacak permohonan', exact: true }).click();
    const unlockResponse = await unlocked; assert.equal(unlockResponse.status(), 200, await unlockResponse.text());
    await guest.getByRole('heading', { name: receipt.register }).waitFor();
    await capture(guest, 'tracking');
    console.log('Public request and private tracking: passed');

    const staff = await browser.newPage(); staff.on('pageerror', e => errors.push(e.message));
    await login(staff, 'staff-test@example.test');
    assert.equal(new URL(staff.url()).pathname, '/admin/ppid');
    await staff.goto(`${base}/admin/ppid/permohonan/${receipt.id}`);
    await staff.getByRole('heading', { name: receipt.register }).waitFor();
    await capture(staff, 'service-detail');
    await staff.getByLabel('Tindakan', { exact: true }).selectOption('processing');
    await staff.getByLabel('Pesan kepada pemohon', { exact: true }).fill('Permohonan sedang diproses.');
    await staff.getByRole('button', { name: 'Simpan dan jalankan' }).click();
    await staff.getByText('Permohonan sedang diproses.', { exact: true }).first().waitFor();
    assert.equal(await staff.evaluate(async () => (await fetch('/api/v1/admin/users', { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })).status), 403);
    console.log('Non-admin staff access and service action: passed');

    await admin.goto(`${base}/admin/ppid/formulir`);
    await admin.getByLabel('Template layanan').selectOption('survey');
    await admin.getByRole('button', { name: 'Tambah kolom' }).click();
    await admin.getByLabel('Label', { exact: true }).fill('Komentar tambahan');
    const formSaved = admin.waitForResponse(r => r.url().endsWith('/admin/ppid/forms/survey') && r.request().method() === 'PUT');
    await admin.getByRole('button', { name: 'Terbitkan versi baru' }).click();
    assert.equal((await formSaved).status(), 200);
    await capture(admin, 'form-editor');
    await admin.goto(`${base}/admin/ppid/pengaturan`);
    await capture(admin, 'settings');
    console.log('Form version publishing and settings: passed');
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${output}/verification.json`, JSON.stringify({ passed: true, errors, documentId, submissionId: receipt.id, viewports: [375, 768, 1440] }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
