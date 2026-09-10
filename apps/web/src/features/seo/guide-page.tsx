import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { brand } from '@cg/shared-config';

export type GuideSection = {
  title: string;
  body: string;
};

export type GuideFaq = {
  question: string;
  answer: string;
};

export type GuideLink = {
  href: string;
  label: string;
};

export type GuideConfig = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedLinks: GuideLink[];
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateGuideMetadata(config: GuideConfig): Metadata {
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: config.path },
    openGraph: {
      type: 'article',
      title: config.title,
      description: config.description,
      url: config.path,
      siteName: brand.name,
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
  };
}

export function GuidePage({
  config,
  extraSection,
}: {
  config: GuideConfig;
  extraSection?: ReactNode;
}) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="space-y-3 rounded-2xl bg-primary-light p-5 shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">SEO Guide</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {config.h1}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted">{config.intro}</p>
      </header>

      {extraSection}

      <section className="space-y-4">
        {config.sections.map((section) => (
          <article key={section.title} className="rounded-2xl bg-background p-5 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground">Related Pages</h2>
        <div className="flex flex-wrap gap-2">
          {config.relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-line bg-primary-light px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {config.faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl bg-background p-4 shadow-card">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                {faq.question}
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        For more vehicle discovery, browse{' '}
        <Link href="/" className="font-medium text-primary transition hover:text-primary-dark">
          {brand.name}
        </Link>
        .
      </p>
    </div>
  );
}

export function siteUrl(): string {
  return SITE_URL;
}
