import React from 'react'
import { Copy, Eye, EyeOff } from 'lucide-react'

export function AuthSettingsTab({
  form,
  setForm,
  showSecrets,
  setShowSecrets,
  copyToClipboard,
  origin,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showSecrets: Record<string, boolean>
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  copyToClipboard: (text: string, label: string) => void
  origin: string
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[16px] border border-sky-100 bg-sky-50/80 p-5 text-xs text-slate-800">
        <p className="font-semibold text-sky-950">Panduan Konfigurasi Social Login & SSO:</p>
        <p className="mt-1 leading-relaxed">
          Daftarkan URL Callback (Redirect URI) berikut ke konsol pengembang masing-masing penyedia (Google Cloud, GitHub, Facebook, atau OIDC/Keycloak).
          Pastikan Anda mengaktifkan opsi &amp; mengisi Client ID dan Secret, lalu klik tombol <strong>Simpan</strong> di atas.
        </p>
      </div>

      {/* 1. Google OAuth */}
      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="text-sm font-bold text-ink">1. Google Login (Workspace / Akun Google)</h3>
            <p className="text-xs text-subtle">Autentikasi menggunakan akun Google / Google Workspace sekolah.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Status:</span>
            <select
              value={form.auth_social_google_enabled ?? '0'}
              onChange={(e) => setForm({ ...form, auth_social_google_enabled: e.target.value })}
              className="rounded-lg border border-line bg-page px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="0">Nonaktif</option>
              <option value="1">Aktif</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Redirect URI (Callback URL)</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${origin}/auth/google/callback`}
                className="w-full rounded-[10px] border border-line bg-page px-3 py-2 text-xs font-mono text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(`${origin}/auth/google/callback`, 'Google Callback URL')}
                className="rounded-[10px] border border-line bg-white p-2 text-slate-600 hover:bg-page"
                title="Salin URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Google Client ID</label>
            <input
              type="text"
              placeholder="xxxxx-xxxx.apps.googleusercontent.com"
              value={form.auth_social_google_client_id || ''}
              onChange={(e) => setForm({ ...form, auth_social_google_client_id: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Google Client Secret</label>
            <div className="relative">
              <input
                type={showSecrets.google ? 'text' : 'password'}
                placeholder="GOCSPX-xxxxxx"
                value={form.auth_social_google_client_secret || ''}
                onChange={(e) => setForm({ ...form, auth_social_google_client_secret: e.target.value })}
                className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowSecrets((s) => ({ ...s, google: !s.google }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showSecrets.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink">Teks Kustom Tombol Login</label>
            <input
              type="text"
              placeholder="Default: Masuk dengan Google"
              value={form.auth_social_google_button_text || ''}
              onChange={(e) => setForm({ ...form, auth_social_google_button_text: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-subtle">
              Contoh: "Masuk dengan Google Workspace" atau "Login dengan Akun Google Sekolah".
            </p>
          </div>
        </div>
      </section>

      {/* 2. Generic OIDC (Belajar.id / Keycloak / Kemdikbud) */}
      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="text-sm font-bold text-ink">2. OpenID Connect (OIDC / SSO Belajar.id / Keycloak)</h3>
            <p className="text-xs text-subtle">Integrasi Single Sign-On (SSO) sekolah, pemerintah, atau penyedia OIDC custom.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Status:</span>
            <select
              value={form.auth_social_oidc_enabled ?? '0'}
              onChange={(e) => setForm({ ...form, auth_social_oidc_enabled: e.target.value })}
              className="rounded-lg border border-line bg-page px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="0">Nonaktif</option>
              <option value="1">Aktif</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Redirect URI (Callback URL)</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${origin}/auth/oidc/callback`}
                className="w-full rounded-[10px] border border-line bg-page px-3 py-2 text-xs font-mono text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(`${origin}/auth/oidc/callback`, 'OIDC Callback URL')}
                className="rounded-[10px] border border-line bg-white p-2 text-slate-600 hover:bg-page"
                title="Salin URL"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Nama Label SSO</label>
            <input
              type="text"
              placeholder="Contoh: SSO Belajar.id / SSO Sekolah"
              value={form.auth_social_oidc_name || ''}
              onChange={(e) => setForm({ ...form, auth_social_oidc_name: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Base / Issuer URL OIDC</label>
            <input
              type="text"
              placeholder="Contoh: https://sso.belajar.id atau https://auth.sekolah.sch.id"
              value={form.auth_social_oidc_base_url || ''}
              onChange={(e) => setForm({ ...form, auth_social_oidc_base_url: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">OIDC Client ID</label>
            <input
              type="text"
              placeholder="client-id-dari-sso"
              value={form.auth_social_oidc_client_id || ''}
              onChange={(e) => setForm({ ...form, auth_social_oidc_client_id: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">OIDC Client Secret</label>
            <div className="relative">
              <input
                type={showSecrets.oidc ? 'text' : 'password'}
                placeholder="client-secret-sso"
                value={form.auth_social_oidc_client_secret || ''}
                onChange={(e) => setForm({ ...form, auth_social_oidc_client_secret: e.target.value })}
                className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowSecrets((s) => ({ ...s, oidc: !s.oidc }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showSecrets.oidc ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink">Teks Kustom Tombol Login SSO</label>
            <input
              type="text"
              placeholder="Default: Masuk dengan Akun Belajar.id / SSO"
              value={form.auth_social_oidc_button_text || ''}
              onChange={(e) => setForm({ ...form, auth_social_oidc_button_text: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <details className="rounded-xl border border-line bg-page p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700">
                Endpoint Lanjutan (Opsional jika issuer tidak memakai standar Keycloak/OIDC)
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom Auth URL</label>
                  <input
                    type="text"
                    placeholder="Default otomatis: {base_url}/protocol/openid-connect/auth"
                    value={form.auth_social_oidc_auth_url || ''}
                    onChange={(e) => setForm({ ...form, auth_social_oidc_auth_url: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom Token URL</label>
                  <input
                    type="text"
                    placeholder="Default otomatis: {base_url}/protocol/openid-connect/token"
                    value={form.auth_social_oidc_token_url || ''}
                    onChange={(e) => setForm({ ...form, auth_social_oidc_token_url: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Custom UserInfo URL</label>
                  <input
                    type="text"
                    placeholder="Default otomatis: {base_url}/protocol/openid-connect/userinfo"
                    value={form.auth_social_oidc_userinfo_url || ''}
                    onChange={(e) => setForm({ ...form, auth_social_oidc_userinfo_url: e.target.value })}
                    className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* 3. GitHub & Facebook */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* GitHub */}
        <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-sm font-bold text-ink">3. GitHub Login</h3>
            <select
              value={form.auth_social_github_enabled ?? '0'}
              onChange={(e) => setForm({ ...form, auth_social_github_enabled: e.target.value })}
              className="rounded-lg border border-line bg-page px-2.5 py-1 text-xs font-semibold outline-none"
            >
              <option value="0">Nonaktif</option>
              <option value="1">Aktif</option>
            </select>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Callback URL</label>
              <input
                readOnly
                value={`${origin}/auth/github/callback`}
                className="w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-[11px] font-mono text-slate-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Client ID</label>
              <input
                type="text"
                value={form.auth_social_github_client_id || ''}
                onChange={(e) => setForm({ ...form, auth_social_github_client_id: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Client Secret</label>
              <input
                type="password"
                value={form.auth_social_github_client_secret || ''}
                onChange={(e) => setForm({ ...form, auth_social_github_client_secret: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Teks Tombol Kustom</label>
              <input
                type="text"
                placeholder="Default: Masuk dengan GitHub"
                value={form.auth_social_github_button_text || ''}
                onChange={(e) => setForm({ ...form, auth_social_github_button_text: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>
        </section>

        {/* Facebook */}
        <section className="rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-sm font-bold text-ink">4. Facebook Login</h3>
            <select
              value={form.auth_social_facebook_enabled ?? '0'}
              onChange={(e) => setForm({ ...form, auth_social_facebook_enabled: e.target.value })}
              className="rounded-lg border border-line bg-page px-2.5 py-1 text-xs font-semibold outline-none"
            >
              <option value="0">Nonaktif</option>
              <option value="1">Aktif</option>
            </select>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">Callback URL</label>
              <input
                readOnly
                value={`${origin}/auth/facebook/callback`}
                className="w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-[11px] font-mono text-slate-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">App ID (Client ID)</label>
              <input
                type="text"
                value={form.auth_social_facebook_client_id || ''}
                onChange={(e) => setForm({ ...form, auth_social_facebook_client_id: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">App Secret</label>
              <input
                type="password"
                value={form.auth_social_facebook_client_secret || ''}
                onChange={(e) => setForm({ ...form, auth_social_facebook_client_secret: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink">Teks Tombol Kustom</label>
              <input
                type="text"
                placeholder="Default: Masuk dengan Facebook"
                value={form.auth_social_facebook_button_text || ''}
                onChange={(e) => setForm({ ...form, auth_social_facebook_button_text: e.target.value })}
                className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
