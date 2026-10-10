import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { auditSite } from './seo-audit';

const directories: string[] = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

function fixture(options: { canonical?: string; link?: string; noindex?: boolean; title?: string } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'normie-seo-'));
  directories.push(directory);
  mkdirSync(join(directory, 'models'), { recursive: true });
  const url = 'https://normiemode.com/models/example';
  writeFileSync(join(directory, 'sitemap-0.xml'), `<?xml version="1.0"?><urlset><url><loc>${url}</loc></url></urlset>`);
  writeFileSync(join(directory, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://normiemode.com/sitemap-index.xml\n');
  writeFileSync(join(directory, 'models/example.html'), `<!doctype html><html lang="en-GB"><head>
    <title>${options.title ?? 'Example model · Normie Mode'}</title>
    <meta name="description" content="A clear description of this exact AI model, its evidence, costs, limits and the tasks where independent results show that it performs well.">
    ${options.noindex ? '<meta name="robots" content="noindex">' : ''}
    <link rel="canonical" href="${options.canonical ?? url}">
    <meta property="og:title" content="Example model"><meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">{"@context":"https://schema.org"}</script>
    </head><body><main><h1>Example model</h1><p>${'Useful model evidence and methodology. '.repeat(30)}</p>${options.link ? `<a href="${options.link}">Broken</a>` : ''}</main></body></html>`);
  return directory;
}

describe('SEO audit', () => {
  it('passes mechanical integrity for a canonical sitemap page', () => {
    const result = auditSite(fixture());

    expect(result.errors).toEqual([]);
    expect(result.pages).toHaveLength(1);
  });

  it('fails incorrect canonicals and sitemap pages marked noindex', () => {
    const result = auditSite(fixture({ canonical: 'https://www.normiemode.com/models/example', noindex: true }));

    expect(result.errors.join('\n')).toMatch(/canonical is/);
    expect(result.errors.join('\n')).toMatch(/sitemap page is noindex/);
  });

  it('fails internal page links that are not canonical sitemap URLs', () => {
    const result = auditSite(fixture({ link: '/missing' }));

    expect(result.errors.join('\n')).toMatch(/internal page link is not canonical\/in sitemap/);
  });

  it('reports review diagnostics without failing integrity', () => {
    const directory = fixture({ title: 'A deliberately very long title that should be reviewed before it is published anywhere · Normie Mode' });
    const page = join(directory, 'models/example.html');
    writeFileSync(page, readFileSync(page, 'utf8')
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
      .replace(/<meta property="og:title"[^>]*>/, '')
      .replace(/<meta name="twitter:card"[^>]*>/, '')
      .replace(/<p>[\s\S]*?<\/p>/, '<p>Brief evidence.</p>'));

    const result = auditSite(directory);

    expect(result.errors).toEqual([]);
    expect(result.warnings.join('\n')).toMatch(/review long title/);
    expect(result.warnings.join('\n')).toMatch(/review thin main content/);
    expect(result.warnings.join('\n')).toMatch(/have no JSON-LD/);
    expect(result.warnings.join('\n')).toMatch(/have no Open Graph/);
    expect(result.warnings.join('\n')).toMatch(/have no Twitter\/X/);
  });
});
