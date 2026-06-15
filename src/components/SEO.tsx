import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://anglerdeck.com';

export const SEO = ({
  title,
  description,
  canonicalPath = '',
  ogImage = '/pwa-512x512.png',
  ogType = 'website',
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title.includes('AnglerDeck') ? title : `${title} | AnglerDeck`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="AnglerDeck" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  );
};

export { BASE_URL };
