import { Head } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type SeoMeta = {
  title?: string
  description?: string
  canonical?: string
  og_type?: string
  og_image?: string | null
  robots?: string
  locale?: string
  site_name?: string
  geo_region?: string | null
  geo_placename?: string | null
  geo_position?: string | null
  twitter_card?: string
  twitter_site?: string | null
  article_published?: string | null
  article_modified?: string | null
  article_section?: string | null
  article_tags?: string[]
  focus_keyword?: string | null
  google_site_verification?: string | null
  bing_site_verification?: string | null
  sitemap_url?: string | null
  json_ld?: Record<string, unknown> | null
}

type Props = {
  /** home | page slug | article slug */
  kind: 'home' | 'page' | 'article'
  page?: string
  articleSlug?: string
  fallbackTitle?: string
}

export function SeoHead({ kind, page, articleSlug, fallbackTitle }: Props) {
  const endpoint =
    kind === 'home'
      ? '/seo/home'
      : kind === 'article' && articleSlug
        ? `/seo/article/${articleSlug}`
        : `/seo/page/${page || 'artikel'}`

  const { data } = useQuery({
    queryKey: ['seo', kind, page, articleSlug],
    queryFn: async () => (await api.get<SeoMeta>(endpoint)).data,
    staleTime: 60_000,
  })

  const title = data?.title || fallbackTitle || 'Portal Resmi'
  const description = data?.description || ''
  const canonical = data?.canonical
  const image = data?.og_image || undefined
  const robots = data?.robots || 'index,follow'
  const jsonLd = data?.json_ld

  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      {data?.focus_keyword && <meta name="keywords" content={data.focus_keyword} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="id" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}

      {/* Google Search Console + Bing */}
      {data?.google_site_verification && (
        <meta name="google-site-verification" content={data.google_site_verification} />
      )}
      {data?.bing_site_verification && (
        <meta name="msvalidate.01" content={data.bing_site_verification} />
      )}

      {/* Open Graph */}
      <meta property="og:locale" content={data?.locale || 'id_ID'} />
      <meta property="og:type" content={data?.og_type || 'website'} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {data?.site_name && <meta property="og:site_name" content={data.site_name} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:alt" content={title} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content={data?.twitter_card || 'summary_large_image'} />
      {data?.twitter_site && <meta name="twitter:site" content={data.twitter_site} />}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* GEO / local */}
      {data?.geo_region && <meta name="geo.region" content={data.geo_region} />}
      {data?.geo_placename && <meta name="geo.placename" content={data.geo_placename} />}
      {data?.geo_position && <meta name="geo.position" content={data.geo_position} />}
      {data?.geo_position && <meta name="ICBM" content={data.geo_position.replace(';', ', ')} />}

      {/* Article meta */}
      {data?.article_published && (
        <meta property="article:published_time" content={data.article_published} />
      )}
      {data?.article_modified && (
        <meta property="article:modified_time" content={data.article_modified} />
      )}
      {data?.article_section && (
        <meta property="article:section" content={data.article_section} />
      )}
      {(data?.article_tags || []).map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* AEO / AI discoverability */}
      <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs" />
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Head>
  )
}
