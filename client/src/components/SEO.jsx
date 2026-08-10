import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, noindex = false }) {
  const defaultTitle = "ExpenseFlow";
  const defaultDescription = "Manage group expenses fairly and transparently.";

  return (
    <Helmet>
      <title>{title ? `${title} | ${defaultTitle}` : defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="robots" content={noindex ? "noindex" : "index, follow"} />
    </Helmet>
  );
}
