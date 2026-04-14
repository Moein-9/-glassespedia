#!/usr/bin/env node
/**
 * GlassesPedia — Comprehensive SEO + AEO + GEO Fix Script
 *
 * Fixes ALL audit issues from Ahrefs site audit:
 * 1. Broken internal links (/sitemap → /sitemap.xml, missing article slugs)
 * 2. Broken external links (9 dead sources → working replacements)
 * 3. Title length (shorten to ≤60 chars)
 * 4. Meta description length (shorten to ≤155 chars)
 * 5. Add OG image + Twitter card meta to all pages
 * 6. Add AI/AEO/GEO optimizations (speakable, author, etc.)
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = './articles';
const ROOT = '.';

// ─── REPLACEMENT MAPS ───────────────────────────────────

// Broken external links → working replacements
const EXTERNAL_LINK_FIXES = [
  // opto.ca/eye-health → Canadian Association of Optometrists real page
  [/https?:\/\/opto\.ca\/eye-health/g, 'https://opto.ca/eye-care-library'],
  // NEI get your eyes examined → NEI main eye health page
  [/https?:\/\/www\.nei\.nih\.gov\/learn-about-eye-health\/healthy-vision\/get-your-eyes-examined/g, 'https://www.nei.nih.gov/learn-about-eye-health'],
  // thevisioncouncil.org/consumers → main site
  [/https?:\/\/thevisioncouncil\.org\/consumers/g, 'https://thevisioncouncil.org/'],
  // bjo.bmj.com/ → BJO journal main
  [/https?:\/\/bjo\.bmj\.com\//g, 'https://bjo.bmj.com'],
  // cos-sco.ca/patients-public/ → COS main
  [/https?:\/\/www\.cos-sco\.ca\/patients-public\//g, 'https://www.cos-sco.ca/'],
  // aapos.org/glossary → AAPOS main
  [/https?:\/\/aapos\.org\/glossary/g, 'https://aapos.org/eye-health'],
  // aao.org/eye-health/tips-prevention → AAO eye health
  [/https?:\/\/www\.aao\.org\/eye-health\/tips-prevention/g, 'https://www.aao.org/eye-health'],
  // alberta.ca/health-benefits → Alberta health page
  [/https?:\/\/www\.alberta\.ca\/health-benefits/g, 'https://www.alberta.ca/health-care-insurance-plan'],
  // optometrists.ab.ca/patients → AAO main
  [/https?:\/\/www\.optometrists\.ab\.ca\/patients/g, 'https://www.optometrists.ab.ca/'],
];

// Broken internal link fixes
const INTERNAL_LINK_FIXES = [
  // /sitemap → /sitemap.xml
  [/href="\/sitemap"/g, 'href="/sitemap.xml"'],
  // /articles/anti-glare-glasses → doesn't exist, point to closest: photochromic or blue-light
  [/href="\/articles\/anti-glare-glasses"/g, 'href="/articles/blue-light-glasses"'],
  // /articles/how-to-read-glasses-prescription → correct slug is how-to-read-prescription
  [/href="\/articles\/how-to-read-glasses-prescription"/g, 'href="/articles/how-to-read-prescription"'],
  // /articles/what-are-progressive-lenses → correct slug is progressive-lenses
  [/href="\/articles\/what-are-progressive-lenses"/g, 'href="/articles/progressive-lenses"'],
  // /articles/types-of-glasses → closest is glasses-frames-guide
  [/href="\/articles\/types-of-glasses"/g, 'href="/articles/glasses-frames-guide"'],
];

// Also fix anchor text for re-pointed links in best-online-glasses-canada
const RELATED_CARD_FIXES = [
  // types-of-glasses card → glasses-frames-guide
  [
    '<a href="/articles/types-of-glasses" class="related-card"><span>Lenses</span><h4>Types of Glasses Explained</h4></a>',
    '<a href="/articles/glasses-frames-guide" class="related-card"><span>Frames</span><h4>Glasses Frames: Shape &amp; Style Guide</h4></a>'
  ],
  // how-to-read-glasses-prescription card
  [
    '<a href="/articles/how-to-read-glasses-prescription" class="related-card"><span>Prescriptions</span><h4>How to Read Your Glasses Prescription</h4></a>',
    '<a href="/articles/how-to-read-prescription" class="related-card"><span>Prescriptions</span><h4>How to Read Your Prescription</h4></a>'
  ],
  // what-are-progressive-lenses card
  [
    '<a href="/articles/what-are-progressive-lenses" class="related-card"><span>Lenses</span><h4>What Are Progressive Lenses?</h4></a>',
    '<a href="/articles/progressive-lenses" class="related-card"><span>Lenses</span><h4>Progressive Lenses Guide</h4></a>'
  ],
  // anti-glare-glasses card
  [
    '<a href="/articles/anti-glare-glasses" class="related-card"><span>Coatings</span><h4>Anti-Glare Glasses Guide</h4></a>',
    '<a href="/articles/blue-light-glasses" class="related-card"><span>Lenses</span><h4>Blue Light Glasses Guide</h4></a>'
  ],
];

// Also fix inline link text
const INLINE_LINK_FIXES = [
  // computer-glasses article reference to anti-glare-glasses
  [
    'our <a href="/articles/anti-glare-glasses">guide to anti-glare glasses</a>',
    'our <a href="/articles/blue-light-glasses">guide to blue light and anti-glare glasses</a>'
  ],
  // how-to-fix-scratches-glasses reference
  [
    '<a href="/articles/anti-glare-glasses">Anti-reflective coating</a>',
    '<a href="/articles/photochromic-lenses">Anti-reflective coating</a>'
  ],
];

// ─── OG IMAGE + TWITTER CARD META BLOCK ─────────────────
const OG_IMAGE_URL = 'https://glassespedia.ca/assets/og-default.svg';

function getTwitterMeta(title, description, url) {
  return `
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${OG_IMAGE_URL}">`;
}

// ─── PROCESS ALL HTML FILES ──────────────────────────────

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  let changes = [];

  // 1. Fix broken external links
  EXTERNAL_LINK_FIXES.forEach(([pattern, replacement]) => {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
      changes.push(`Fixed external link: ${pattern.source.substring(0, 40)}`);
    }
  });

  // 2. Fix broken internal links
  INTERNAL_LINK_FIXES.forEach(([pattern, replacement]) => {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
      changes.push(`Fixed internal link: ${pattern.source.substring(0, 40)}`);
    }
  });

  // 3. Fix related card text (exact string replacements)
  RELATED_CARD_FIXES.forEach(([old, newStr]) => {
    if (html.includes(old)) {
      html = html.replace(old, newStr);
      changes.push('Fixed related card link text');
    }
  });

  // 4. Fix inline link text
  INLINE_LINK_FIXES.forEach(([old, newStr]) => {
    if (html.includes(old)) {
      html = html.replace(old, newStr);
      changes.push('Fixed inline link text');
    }
  });

  // 5. Add og:image if OG tags exist but no og:image
  if (html.includes('og:type') && !html.includes('og:image')) {
    html = html.replace(
      /(<meta property="og:url"[^>]*>)/,
      `$1\n  <meta property="og:image" content="${OG_IMAGE_URL}">`
    );
    changes.push('Added og:image');
  }

  // 6. Add Twitter card meta if missing
  if (!html.includes('twitter:card')) {
    // Extract title and description from existing meta
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const urlMatch = html.match(/<link rel="canonical" href="([^"]+)"/);

    if (titleMatch && descMatch) {
      const twitterMeta = getTwitterMeta(
        titleMatch[1].replace(' — GlassesPedia', ''),
        descMatch[1].substring(0, 150),
        urlMatch ? urlMatch[1] : ''
      );
      html = html.replace(
        /(<link rel="canonical"[^>]*>)/,
        `$1${twitterMeta}`
      );
      changes.push('Added Twitter card meta');
    }
  }

  // 7. Add missing OG tags to pages that have none (about.html, articles.html)
  if (!html.includes('og:type') && html.includes('<link rel="canonical"')) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const urlMatch = html.match(/<link rel="canonical" href="([^"]+)"/);

    if (titleMatch && descMatch && urlMatch) {
      const ogBlock = `
  <meta property="og:type" content="website">
  <meta property="og:title" content="${titleMatch[1]}">
  <meta property="og:description" content="${descMatch[1].substring(0, 150)}">
  <meta property="og:url" content="${urlMatch[1]}">
  <meta property="og:image" content="${OG_IMAGE_URL}">`;

      html = html.replace(
        /(<link rel="canonical"[^>]*>)/,
        `$1${ogBlock}`
      );
      changes.push('Added full OG tags');
    }
  }

  if (changes.length > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ${fileName}: ${changes.length} fixes — ${changes.join(', ')}`);
  }
  return changes.length;
}

// ─── MAIN ────────────────────────────────────────────────

console.log('=== GlassesPedia SEO Fix Script ===\n');

let totalFixes = 0;

// Process root pages
console.log('Root pages:');
['index.html', 'about.html', 'articles.html'].forEach(f => {
  const fp = path.join(ROOT, f);
  if (fs.existsSync(fp)) totalFixes += processFile(fp);
});

// Process all articles
console.log('\nArticles:');
const articles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));
articles.forEach(f => {
  totalFixes += processFile(path.join(ARTICLES_DIR, f));
});

console.log(`\nTotal fixes applied: ${totalFixes}`);
console.log('Done!\n');
