import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://normiemode.com';
const SITEMAP = 'sitemap-0.xml';
const TITLE_REVIEW_LENGTH = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 160;
const THIN_WORD_REVIEW = 200;
const SIMILARITY_REVIEW = 0.8;
const MAX_SIMILARITY_WARNINGS = 25;

export interface PageAudit {
  route: string;
  file: string;
  title: string;
  description: string;
  canonical?: string;
  h1: string[];
  robots?: string;
  words: number;
  internalLinks: string[];
  jsonLd: number;
  openGraph: number;
  twitter: number;
  social: Record<string, string | undefined>;
  mainTokens: Set<string>;
}

export interface AuditResult {
  errors: string[];
  warnings: string[];
  pages: PageAudit[];
  sitemapUrls: string[];
}

interface SitemapEntry {
  url: string;
  lastmod?: string;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

function attributes(tag: string) {
  const result = new Map<string, string>();
  for (const match of tag.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return result;
}

function tags(html: string, name: string) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function contents(html: string, name: string) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'gi'))]
    .map((match) => text(match[1]));
}

function text(html: string) {
  return decodeHtml(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function meta(html: string, key: 'name' | 'property', value: string) {
  for (const tag of tags(html, 'meta')) {
    const attrs = attributes(tag);
    if (attrs.get(key)?.toLowerCase() === value.toLowerCase()) return attrs.get('content') ?? '';
  }
}

function canonical(html: string) {
  for (const tag of tags(html, 'link')) {
    const attrs = attributes(tag);
    if ((attrs.get('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')) return attrs.get('href');
  }
}

function routeFile(directory: string, url: string) {
  const pathname = new URL(url).pathname;
  return pathname === '/' ? join(directory, 'index.html') : join(directory, `${pathname.slice(1)}.html`);
}

function normaliseInternalLink(href: string, pageUrl: string) {
  if (/^(?:mailto:|tel:|javascript:|data:)/i.test(href)) return;
  let url: URL;
  try {
    url = new URL(href, pageUrl);
  } catch {
    return;
  }
  if (url.origin !== ORIGIN || url.pathname.startsWith('/api/')) return;
  if (extname(url.pathname) && !url.pathname.endsWith('.html')) return;
  let pathname = url.pathname;
  if (pathname === '/index.html') pathname = '/';
  else if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'/index.html'.length) || '/';
  else if (pathname.endsWith('.html')) pathname = pathname.slice(0, -'.html'.length) || '/';
  return `${ORIGIN}${pathname}`;
}

function tokens(value: string) {
  return new Set((value.toLowerCase().match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) ?? [])
    .filter((token) => token.length > 2));
}

function similarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function family(route: string) {
  return route === '/' ? 'home' : route.split('/').filter(Boolean)[0] ?? 'home';
}

function listHtmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listHtmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}

function inspectPage(directory: string, url: string): PageAudit {
  const file = routeFile(directory, url);
  const html = readFileSync(file, 'utf8');
  const title = contents(html, 'title')[0] ?? '';
  const description = meta(html, 'name', 'description') ?? '';
  const h1 = contents(html, 'h1');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const visible = text(main);
  const links = tags(html, 'a')
    .map((tag) => attributes(tag).get('href'))
    .filter((href): href is string => href !== undefined)
    .map((href) => normaliseInternalLink(href, url))
    .filter((href): href is string => href !== undefined);
  const scripts = tags(html, 'script').map(attributes);
  const metas = tags(html, 'meta').map(attributes);
  return {
    route: new URL(url).pathname,
    file: relative(process.cwd(), file),
    title,
    description,
    canonical: canonical(html),
    h1,
    robots: meta(html, 'name', 'robots'),
    words: visible.match(/\b[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*\b/gu)?.length ?? 0,
    internalLinks: [...new Set(links)],
    jsonLd: scripts.filter((attrs) => attrs.get('type')?.toLowerCase() === 'application/ld+json').length,
    openGraph: metas.filter((attrs) => attrs.get('property')?.toLowerCase().startsWith('og:')).length,
    twitter: metas.filter((attrs) => attrs.get('name')?.toLowerCase().startsWith('twitter:')).length,
    social: {
      ogTitle: meta(html, 'property', 'og:title'),
      ogDescription: meta(html, 'property', 'og:description'),
      ogUrl: meta(html, 'property', 'og:url'),
      ogType: meta(html, 'property', 'og:type'),
      ogSiteName: meta(html, 'property', 'og:site_name'),
      ogImage: meta(html, 'property', 'og:image'),
      ogImageWidth: meta(html, 'property', 'og:image:width'),
      ogImageHeight: meta(html, 'property', 'og:image:height'),
      ogImageAlt: meta(html, 'property', 'og:image:alt'),
      twitterCard: meta(html, 'name', 'twitter:card'),
      twitterTitle: meta(html, 'name', 'twitter:title'),
      twitterDescription: meta(html, 'name', 'twitter:description'),
      twitterImage: meta(html, 'name', 'twitter:image'),
      twitterImageAlt: meta(html, 'name', 'twitter:image:alt'),
    },
    mainTokens: tokens(visible),
  };
}

export function auditSite(directory = resolve('dist')): AuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sitemapPath = join(directory, SITEMAP);
  const robotsPath = join(directory, 'robots.txt');
  if (!existsSync(directory)) return { errors: [`Build directory not found: ${directory}. Run npm run build first.`], warnings, pages: [], sitemapUrls: [] };
  if (!existsSync(sitemapPath)) return { errors: [`Missing ${SITEMAP}. Run npm run build first.`], warnings, pages: [], sitemapUrls: [] };

  const sitemapXml = readFileSync(sitemapPath, 'utf8');
  const sitemapEntries: SitemapEntry[] = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
    url: decodeHtml(match[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''),
    lastmod: match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
  }));
  const sitemapUrls = sitemapEntries.map((entry) => entry.url);
  const uniqueUrls = new Set(sitemapUrls);
  if (!sitemapUrls.length) errors.push(`${SITEMAP} contains no URLs.`);
  if (uniqueUrls.size !== sitemapUrls.length) errors.push(`${SITEMAP} contains ${sitemapUrls.length - uniqueUrls.size} duplicate URL(s).`);

  for (const url of sitemapUrls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      errors.push(`Invalid sitemap URL: ${url}`);
      continue;
    }
    if (parsed.origin !== ORIGIN || parsed.search || parsed.hash || parsed.pathname.endsWith('.html') || (parsed.pathname !== '/' && parsed.pathname.endsWith('/'))) {
      errors.push(`Non-canonical sitemap URL: ${url}`);
    }
    if (!existsSync(routeFile(directory, url))) errors.push(`Sitemap URL has no generated page: ${url}`);
  }
  let withoutLastmod = 0;
  for (const entry of sitemapEntries) {
    if (!entry.lastmod) withoutLastmod += 1;
    else if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(entry.lastmod)) errors.push(`${entry.url || 'Sitemap entry'}: invalid lastmod date.`);
  }
  if (withoutLastmod) warnings.push(`Sitemap: ${withoutLastmod} of ${sitemapEntries.length} URLs have no trustworthy dated dependency, so lastmod is omitted.`);

  if (!existsSync(robotsPath)) errors.push('Missing robots.txt.');
  else {
    const robots = readFileSync(robotsPath, 'utf8');
    if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap-index.xml`)) errors.push('robots.txt does not name the canonical sitemap index.');
    const groups = new Map<string, string[]>();
    let agents: string[] = [];
    for (const sourceLine of robots.split(/\r?\n/)) {
      const line = sourceLine.replace(/#.*$/, '').trim();
      if (!line) {
        agents = [];
        continue;
      }
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      const field = line.slice(0, separator).trim().toLowerCase();
      const value = line.slice(separator + 1).trim();
      if (field === 'user-agent') {
        agents.push(value.toLowerCase());
        if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), []);
      } else if ((field === 'allow' || field === 'disallow') && agents.length) {
        for (const agent of agents) groups.get(agent)?.push(`${field}:${value}`);
      }
    }
    const requiredPolicy = new Map([
      ['oai-searchbot', 'allow:/'],
      ['claude-searchbot', 'allow:/'],
      ['gptbot', 'disallow:/'],
      ['claudebot', 'disallow:/'],
      ['*', 'allow:/'],
    ]);
    for (const [agent, directive] of requiredPolicy) {
      if (!groups.get(agent)?.includes(directive)) errors.push(`robots.txt must set ${agent} to ${directive}.`);
    }
  }

  const pages = sitemapUrls.filter((url) => existsSync(routeFile(directory, url))).map((url) => inspectPage(directory, url));
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  let withoutJsonLd = 0;
  let withoutOpenGraph = 0;
  let withoutTwitter = 0;
  for (const page of pages) {
    const expected = `${ORIGIN}${page.route}`;
    if (!page.title) errors.push(`${page.route}: missing title.`);
    if (!page.description) errors.push(`${page.route}: missing meta description.`);
    if (page.h1.length !== 1) errors.push(`${page.route}: expected one H1, found ${page.h1.length}.`);
    if (page.canonical !== expected) errors.push(`${page.route}: canonical is ${page.canonical ?? 'missing'}, expected ${expected}.`);
    if (page.robots?.toLowerCase().split(',').some((rule) => rule.trim() === 'noindex')) errors.push(`${page.route}: sitemap page is noindex.`);
    for (const link of page.internalLinks) if (!uniqueUrls.has(link)) errors.push(`${page.route}: internal page link is not canonical/in sitemap: ${link}.`);

    const requiredSocial = ['ogTitle', 'ogDescription', 'ogUrl', 'ogType', 'ogSiteName', 'ogImage', 'ogImageWidth', 'ogImageHeight', 'ogImageAlt', 'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage', 'twitterImageAlt'];
    for (const field of requiredSocial) if (!page.social[field]) errors.push(`${page.route}: missing social metadata ${field}.`);
    if (page.social.ogTitle !== page.title || page.social.twitterTitle !== page.title) errors.push(`${page.route}: social title does not match page title.`);
    if (page.social.ogDescription !== page.description || page.social.twitterDescription !== page.description) errors.push(`${page.route}: social description does not match meta description.`);
    if (page.social.ogUrl !== expected) errors.push(`${page.route}: Open Graph URL is ${page.social.ogUrl ?? 'missing'}, expected ${expected}.`);
    if (page.social.ogImage && (!page.social.ogImage.startsWith(`${ORIGIN}/`) || page.social.twitterImage !== page.social.ogImage)) errors.push(`${page.route}: social image must be one absolute canonical site URL.`);

    if (page.title.length > TITLE_REVIEW_LENGTH) warnings.push(`${page.route}: review long title (${page.title.length} characters).`);
    if (page.description && (page.description.length < DESCRIPTION_MIN || page.description.length > DESCRIPTION_MAX)) {
      warnings.push(`${page.route}: review description length (${page.description.length} characters).`);
    }
    if (page.words < THIN_WORD_REVIEW) warnings.push(`${page.route}: review thin main content (${page.words} words).`);
    if (!page.jsonLd) withoutJsonLd += 1;
    if (!page.openGraph) withoutOpenGraph += 1;
    if (!page.twitter) withoutTwitter += 1;

    titles.set(page.title, [...(titles.get(page.title) ?? []), page.route]);
    descriptions.set(page.description, [...(descriptions.get(page.description) ?? []), page.route]);
  }
  if (withoutJsonLd) warnings.push(`Site-wide: ${withoutJsonLd} of ${pages.length} sitemap pages have no JSON-LD.`);
  if (withoutOpenGraph) warnings.push(`Site-wide: ${withoutOpenGraph} of ${pages.length} sitemap pages have no Open Graph metadata.`);
  if (withoutTwitter) warnings.push(`Site-wide: ${withoutTwitter} of ${pages.length} sitemap pages have no Twitter/X card metadata.`);
  for (const [title, routes] of titles) if (title && routes.length > 1) errors.push(`Duplicate title on ${routes.join(', ')}: ${title}`);
  for (const [description, routes] of descriptions) if (description && routes.length > 1) warnings.push(`Duplicate description on ${routes.join(', ')}.`);

  const similar: { a: string; b: string; score: number }[] = [];
  for (let i = 0; i < pages.length; i += 1) {
    for (let j = i + 1; j < pages.length; j += 1) {
      const a = pages[i], b = pages[j];
      if (family(a.route) !== family(b.route)) continue;
      const score = similarity(a.mainTokens, b.mainTokens);
      if (score >= SIMILARITY_REVIEW) similar.push({ a: a.route, b: b.route, score });
    }
  }
  similar.sort((a, b) => b.score - a.score || a.a.localeCompare(b.a) || a.b.localeCompare(b.b));
  for (const item of similar.slice(0, MAX_SIMILARITY_WARNINGS)) {
    warnings.push(`${item.a} and ${item.b}: review content similarity (${Math.round(item.score * 100)}%).`);
  }
  if (similar.length > MAX_SIMILARITY_WARNINGS) {
    warnings.push(`Site-wide: ${similar.length - MAX_SIMILARITY_WARNINGS} additional same-family page pairs exceed ${SIMILARITY_REVIEW * 100}% token similarity; use --json for page data.`);
  }

  const generated = new Set(listHtmlFiles(directory).map((file) => relative(directory, file)));
  const expectedFiles = new Set(sitemapUrls.map((url) => relative(directory, routeFile(directory, url))));
  const allowedUnlisted = new Set(['demand.html', 'review.html']);
  for (const file of generated) if (!expectedFiles.has(file) && !allowedUnlisted.has(file)) warnings.push(`${file}: generated HTML is not in the sitemap.`);

  return { errors: [...new Set(errors)].sort(), warnings: [...new Set(warnings)].sort(), pages, sitemapUrls };
}

function summary(result: AuditResult) {
  const counts = new Map<string, number>();
  for (const page of result.pages) counts.set(family(page.route), (counts.get(family(page.route)) ?? 0) + 1);
  const families = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `${name} ${count}`).join(', ');
  return `Audited ${result.pages.length} sitemap pages${families ? ` (${families})` : ''}.`;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const json = process.argv.includes('--json');
  const directoryArg = process.argv.find((arg, index) => index > 1 && !arg.startsWith('--'));
  const result = auditSite(directoryArg ? resolve(directoryArg) : resolve('dist'));
  if (json) {
    console.log(JSON.stringify({
      ...result,
      pages: result.pages.map(({ mainTokens: _, ...page }) => page),
    }, null, 2));
  } else {
    console.log(summary(result));
    if (result.warnings.length) console.log(`\nReview warnings (${result.warnings.length}):\n${result.warnings.map((warning) => `  ! ${warning}`).join('\n')}`);
    if (result.errors.length) console.error(`\nErrors (${result.errors.length}):\n${result.errors.map((error) => `  x ${error}`).join('\n')}`);
    else console.log('\nSEO integrity checks passed.');
  }
  if (result.errors.length) process.exit(1);
}
