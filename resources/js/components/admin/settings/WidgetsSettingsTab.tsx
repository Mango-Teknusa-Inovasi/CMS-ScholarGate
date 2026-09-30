import React from 'react'

export function WidgetsSettingsTab({
  form,
  setForm,
}: {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-sm font-bold text-ink">Kontrol Widget Sidebar Artikel</h2>
        <p className="mb-5 text-xs text-subtle">
          Pilih widget mana saja yang ingin dimunculkan di sisi kanan halaman detail artikel agar halaman tidak kosong.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'widget_search_enabled', label: 'Widget Pencarian Cepat', desc: 'Kotak cari artikel instan' },
            { key: 'widget_announcement_enabled', label: 'Widget Banner / Info Khusus', desc: 'Pengumuman humas atau info pendaftaran' },
            { key: 'widget_categories_enabled', label: 'Widget Kategori Artikel', desc: 'Daftar topik dengan badge jumlah' },
            { key: 'widget_popular_enabled', label: 'Widget Artikel Populer', desc: 'Daftar artikel terpopuler & view count' },
            { key: 'widget_social_enabled', label: 'Widget Media Sosial & Ikuti Kami', desc: 'Card ajakan follow Instagram, YouTube, dll.' },
          ].map((w) => (
            <div key={w.key} className="flex items-start justify-between rounded-xl border border-line bg-page p-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">{w.label}</h3>
                <p className="text-xs text-subtle">{w.desc}</p>
              </div>
              <select
                value={form[w.key] ?? '1'}
                onChange={(e) => setForm({ ...form, [w.key]: e.target.value })}
                className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[16px] border border-line bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-sm font-bold text-ink">Konten Banner / Pengumuman Kustom Sidebar</h2>
        <p className="mb-5 text-xs text-subtle">
          Kustomisasi isi card pengumuman / banner informatif di sebelah kanan artikel.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Judul Banner</label>
            <input
              type="text"
              placeholder="Contoh: Info Sekolah & SPMB"
              value={form.widget_announcement_title ?? 'Pusat Informasi & SPMB'}
              onChange={(e) => setForm({ ...form, widget_announcement_title: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Teks Tombol Tautan</label>
            <input
              type="text"
              placeholder="Contoh: Hubungi Kami / Selengkapnya"
              value={form.widget_announcement_btn_text ?? 'Hubungi Humas'}
              onChange={(e) => setForm({ ...form, widget_announcement_btn_text: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">URL Tautan Tombol</label>
            <input
              type="text"
              placeholder="Contoh: https://wa.me/628123456789 atau /kontak"
              value={form.widget_announcement_url ?? ''}
              onChange={(e) => setForm({ ...form, widget_announcement_url: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">Isi Pesan / Keterangan Banner</label>
            <textarea
              rows={3}
              placeholder="Tuliskan keterangan singkat, jadwal pendaftaran, atau pengumuman penting..."
              value={
                form.widget_announcement_content ??
                'Dapatkan berita terbaru, kalender akademik, dan layanan informasi terpadu sekolah langsung melalui kanal resmi.'
              }
              onChange={(e) => setForm({ ...form, widget_announcement_content: e.target.value })}
              className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
