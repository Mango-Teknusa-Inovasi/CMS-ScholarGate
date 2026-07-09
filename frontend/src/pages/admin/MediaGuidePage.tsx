import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { MEDIA_GUIDES } from '../../lib/mediaGuide'

export function MediaGuidePage() {
  return (
    <div>
      <AdminPageHeader
        title="Panduan ukuran gambar"
        description="Ikuti ukuran ideal agar banner, foto pejabat, galeri, dan logo mitra tampil proporsional di portal."
      />

      <div className="mb-6 rounded-[16px] border border-line bg-peach p-5 text-sm leading-relaxed text-body shadow-[var(--shadow-card)]">
        <p className="font-semibold text-ink">Ringkas</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Format terbaik: <strong>WebP</strong> atau <strong>JPG</strong> (PNG untuk logo transparan).</li>
          <li>Hindari file &gt; 2 MB kecuali benar-benar diperlukan.</li>
          <li>Crop sesuai rasio sebelum upload agar tidak terpotong aneh di mobile.</li>
          <li>Setelah upload, hard-refresh portal jika cache browser menahan gambar lama.</li>
        </ul>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-peach-soft/70 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                <th className="px-5 py-3.5">Jenis</th>
                <th className="px-5 py-3.5">Ukuran ideal</th>
                <th className="px-5 py-3.5">Rasio</th>
                <th className="px-5 py-3.5">Max</th>
                <th className="px-5 py-3.5">Di admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MEDIA_GUIDES.map((g) => (
                <tr key={g.key} className="hover:bg-page/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{g.label}</p>
                    <p className="mt-0.5 text-xs text-subtle">{g.tips}</p>
                  </td>
                  <td className="px-5 py-4 tabular-nums font-medium text-body">
                    {g.width} × {g.height} px
                  </td>
                  <td className="px-5 py-4 text-body">{g.ratio}</td>
                  <td className="px-5 py-4 text-body">~{g.maxMb} MB</td>
                  <td className="px-5 py-4 text-subtle">{g.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
