import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({ title, description, url }) {
  const defaultTitle = "ExpenseFlow — Free Expense Sharing App for Roommates & Couples";
  const defaultDescription = "Track shared expenses fairly over months, not just per bill. See who's contributing fairly with category insights, fairness scores, and scenario planning.";
  const siteUrl = "https://expenseflow.site";

  const fullTitle = title ? `${title} | ExpenseFlow` : defaultTitle;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
      <meta name="twitter:title" content={fullTitle} />

      {description && (
        <>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
          <meta name="twitter:description" content={description} />
        </>
      )}

      {url && (
        <>
          <link rel="canonical" href={fullUrl} />
          <meta property="og:url" content={fullUrl} />
        </>
      )}
    </Helmet>
  );
}

// Hook variant as requested by plan
export function useSEO(config) {
  return <SEO {...config} />;
}
