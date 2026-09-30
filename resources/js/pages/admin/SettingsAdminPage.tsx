import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Globe, KeyRound, LayoutGrid, MapPin, Share2, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { BrandingSettingsTab } from '../../components/admin/settings/BrandingSettingsTab'
import { ContactSettingsTab } from '../../components/admin/settings/ContactSettingsTab'
import { SocialSettingsTab } from '../../components/admin/settings/SocialSettingsTab'
import { WidgetsSettingsTab } from '../../components/admin/settings/WidgetsSettingsTab'
import { SeoSettingsTab } from '../../components/admin/settings/SeoSettingsTab'
import { AiSettingsTab } from '../../components/admin/settings/AiSettingsTab'
import { AuthSettingsTab } from '../../components/admin/settings/AuthSettingsTab'

type TabKey = 'branding' | 'contact' | 'social' | 'widgets' | 'seo' | 'ai' | 'auth'

const TABS: { id: TabKey; label: string; icon: React.ElementType }[] = [
  { id: 'branding', label: 'Identitas & Logo', icon: Building2 },
  { id: 'contact', label: 'Kontak & Alamat', icon: MapPin },
  { id: 'social', label: 'Media Sosial', icon: Share2 },
  { id: 'widgets', label: 'Widget & Sidebar', icon: LayoutGrid },
  { id: 'seo', label: 'SEO & Webmaster', icon: Globe },
  { id: 'ai', label: 'AI & Scraper', icon: Sparkles },
  { id: 'auth', label: 'Social Login & SSO', icon: KeyRound },
]

export function SettingsAdminPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('branding')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get<Record<string, string>>('/admin/settings')).data,
  })
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const [testingAi, setTestingAi] = useState(false)

  const handleTestAi = async () => {
    if (!form.openai_api_key) {
      toast.error('Masukkan API Key terlebih dahulu.')
      return
    }
    setTestingAi(true)
    try {
      const res = await api.post<{ ok: boolean; message: string }>('/admin/ai/test-connection', {
        openai_api_key: form.openai_api_key,
        openai_base_url: form.openai_base_url,
        openai_model: form.openai_model,
      })
      if (res.data.ok) {
        toast.success(res.data.message)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Gagal terhubung ke API AI.')
    } finally {
      setTestingAi(false)
    }
  }

  const save = useMutation({
    mutationFn: async () => api.put('/admin/settings', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Pengaturan disimpan.')
    },
    onError: () => toast.error('Gagal menyimpan pengaturan.'),
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin ke clipboard`)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://domain-anda.sch.id'

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-[16px]" />
          <Skeleton className="h-64 w-full rounded-[16px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pengaturan"
        description="Identitas, branding, kontak, sidebar artikel, SEO, integrasi AI, serta Social Login."
        actions={
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-[12px] bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_10px_rgb(14_165_233/0.25)] transition hover:bg-sky-600 disabled:opacity-60"
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan Semua Perubahan'}
          </button>
        }
      />

      {/* Modern Tabs Navigation */}
      <div className="flex overflow-x-auto rounded-[16px] border border-line bg-white p-1.5 shadow-sm scrollbar-none">
        <div className="flex space-x-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-[12px] px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgb(14_165_233/0.25)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'branding' && <BrandingSettingsTab form={form} setForm={setForm} />}
      {activeTab === 'contact' && <ContactSettingsTab form={form} setForm={setForm} />}
      {activeTab === 'social' && <SocialSettingsTab form={form} setForm={setForm} />}
      {activeTab === 'widgets' && <WidgetsSettingsTab form={form} setForm={setForm} />}
      {activeTab === 'seo' && <SeoSettingsTab form={form} setForm={setForm} origin={origin} />}
      {activeTab === 'ai' && (
        <AiSettingsTab
          form={form}
          setForm={setForm}
          testingAi={testingAi}
          handleTestAi={handleTestAi}
        />
      )}
      {activeTab === 'auth' && (
        <AuthSettingsTab
          form={form}
          setForm={setForm}
          showSecrets={showSecrets}
          setShowSecrets={setShowSecrets}
          copyToClipboard={copyToClipboard}
          origin={origin}
        />
      )}
    </div>
  )
}

export default SettingsAdminPage
