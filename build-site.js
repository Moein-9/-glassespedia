#!/usr/bin/env node
/**
 * GlassesPedia — Scheduled Site Builder
 *
 * ONLY generates HTML for articles whose publish date <= today.
 * This prevents Google from seeing/indexing future content.
 *
 * Run this daily (cron, Vercel build hook, or manually).
 * Each day, new articles appear automatically.
 *
 * Usage:
 *   node build-site.js              # Build with today's date
 *   node build-site.js 2026-05-01   # Build as if today is May 1 (preview)
 *   node build-site.js --all        # Build everything (ignore dates)
 *
 * What it does:
 *   1. Reads schedule.json + content/*.json
 *   2. Only generates HTML for articles with date <= today
 *   3. Rebuilds articles.html with only published articles
 *   4. Rebuilds sitemap.xml with only published URLs
 *   5. Updates homepage with latest published articles
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const customDate = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
const TODAY = customDate || new Date().toISOString().split('T')[0];

console.log('=== GlassesPedia Scheduled Builder ===');
console.log(`Build date: ${TODAY}${buildAll ? ' (--all mode, ignoring dates)' : ''}\n`);

// ──────────────────────────────────────────────
// 1. Read all content specs
// ──────────────────────────────────────────────
const contentDir = './content';
const allSpecs = fs.readdirSync(contentDir)
  .filter(f => f.endsWith('.json'))
  .map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(contentDir, f), 'utf8')); }
    catch (e) { console.error('Bad JSON: ' + f); return null; }
  })
  .filter(Boolean)
  .sort((a, b) => a.date.localeCompare(b.date));

// Split into published vs scheduled
const published = buildAll ? allSpecs : allSpecs.filter(s => s.date <= TODAY);
const scheduled = buildAll ? [] : allSpecs.filter(s => s.date > TODAY);

console.log(`Total specs: ${allSpecs.length}`);
console.log(`Published (date <= ${TODAY}): ${published.length}`);
console.log(`Scheduled (future): ${scheduled.length}\n`);

// ──────────────────────────────────────────────
// 2. Generate HTML ONLY for published articles
// ──────────────────────────────────────────────
console.log('Step 1: Generating published articles...');

// First, clean up any scheduled articles that shouldn't exist yet
const publishedSlugs = new Set(published.map(s => s.slug));
const scheduledSlugs = new Set(scheduled.map(s => s.slug));

// Remove HTML for articles that are still scheduled (in case of rebuild)
let cleaned = 0;
scheduledSlugs.forEach(slug => {
  const fpath = path.join('articles', slug + '.html');
  if (fs.existsSync(fpath)) {
    fs.unlinkSync(fpath);
    cleaned++;
  }
});
if (cleaned > 0) console.log(`Cleaned ${cleaned} future articles from articles/`);

// Generate HTML for published articles that don't have HTML yet
let generated = 0;
published.forEach(spec => {
  const htmlPath = path.join('articles', spec.slug + '.html');
  // Always regenerate to keep content fresh
  const tempPath = path.join(contentDir, spec.slug + '.json');
  if (fs.existsSync(tempPath)) {
    try {
      execSync(`node generate-article.js "${tempPath}"`, { stdio: 'pipe' });
      generated++;
    } catch (e) {
      console.error('  Failed: ' + spec.slug);
    }
  }
});
console.log(`Generated ${generated} article HTML files\n`);

// ──────────────────────────────────────────────
// 3. Get list of all live articles (originals + published scheduled)
// ──────────────────────────────────────────────
const liveArticles = fs.readdirSync('./articles')
  .filter(f => f.endsWith('.html'))
  .map(f => f.replace('.html', ''));

console.log(`Step 2: Building articles.html (${liveArticles.length} live articles)...`);

function capitalize(s) {
  return (s || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function guessCat(slug) {
  if (/frame|rimless|aviator|cat-eye|horn|square-glass|round-glass/i.test(slug)) return 'frames';
  if (/prescription|pd|axis/i.test(slug)) return 'prescriptions';
  if (/coat|anti-glare|anti-reflect/i.test(slug)) return 'coatings';
  if (/sunglass|polariz/i.test(slug)) return 'sunglasses';
  if (/astigmat|myopia|presbyop|eye-strain|dry-eye|signs-you-need/i.test(slug)) return 'eye-conditions';
  if (/clean|fix|repair|adjust|tight|loose|scratch|slide|care/i.test(slug)) return 'care';
  if (/buy|cost|price|best|where|online/i.test(slug)) return 'buying-guide';
  if (/kid|child/i.test(slug)) return 'kids';
  return 'lenses';
}

// Build cards — published specs first (they have metadata), then originals
const specMap = {};
published.forEach(s => { specMap[s.slug] = s; });

let cardsHtml = '';
// Sort: newest first
const sortedLive = [...liveArticles].sort((a, b) => {
  const dateA = specMap[a] ? specMap[a].date : '2026-04-12';
  const dateB = specMap[b] ? specMap[b].date : '2026-04-12';
  return dateB.localeCompare(dateA);
});

sortedLive.forEach(slug => {
  const spec = specMap[slug];
  const cat = spec ? spec.category : guessCat(slug);
  const title = spec ? spec.title : capitalize(slug);
  const desc = spec ? (spec.description || '').substring(0, 120) : 'Read the full article on GlassesPedia.';
  const readTime = spec ? (spec.readTime || '7 min') : '7 min';

  cardsHtml += `      <a href="/articles/${slug}" class="article-card" data-cat="${cat}">
        <div class="article-card-thumb"></div>
        <div class="article-card-body">
          <span class="article-card-cat">${capitalize(cat)}</span>
          <h3>${title}</h3>
          <p>${desc}</p>
          <div class="article-card-footer"><span>${readTime}</span><span class="article-card-read">Read &rarr;</span></div>
        </div>
      </a>\n`;
});

// Write articles.html
const articlesPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Articles — GlassesPedia Encyclopedia of Eyewear</title>
  <meta name="description" content="Browse all ${liveArticles.length}+ GlassesPedia articles on lenses, frames, prescriptions, coatings, eye conditions, sunglasses, and eyewear care.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://glassespedia.ca/articles">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <nav class="nav" id="nav">
    <a href="/" class="nav-logo">GP</a>
    <div class="nav-center" id="navLinks"><a href="/#gallery">Explore</a><a href="/#topics">Topics</a><a href="/articles">Articles</a><a href="/about">About</a></div>
    <button class="nav-toggle" id="menuBtn" aria-label="Toggle menu"><span></span><span></span></button>
  </nav>
  <main class="articles-page">
    <div class="articles-page-header">
      <h1>All Articles (${liveArticles.length})</h1>
      <p>Browse the full GlassesPedia encyclopedia — lenses, frames, prescriptions, and everything about eyewear.</p>
    </div>
    <div class="cat-filters">
      <button class="cat-pill active" data-cat="all">All</button>
      <button class="cat-pill" data-cat="lenses">Lenses</button>
      <button class="cat-pill" data-cat="frames">Frames</button>
      <button class="cat-pill" data-cat="prescriptions">Prescriptions</button>
      <button class="cat-pill" data-cat="coatings">Coatings</button>
      <button class="cat-pill" data-cat="sunglasses">Sunglasses</button>
      <button class="cat-pill" data-cat="eye-conditions">Eye Health</button>
      <button class="cat-pill" data-cat="care">Care</button>
      <button class="cat-pill" data-cat="buying-guide">Buying Guide</button>
    </div>
    <div style="max-width:1200px;margin:0 auto;padding:0 32px 32px;">
      <div class="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="search" id="articleSearch" placeholder="Search articles...">
      </div>
    </div>
    <div class="articles-grid">
${cardsHtml}    </div>
  </main>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="footer-logo">GP</span>
        <p>GlassesPedia &mdash; The AI-Powered Encyclopedia of Eyewear</p>
        <p style="margin-top:12px;font-size:0.8125rem;color:rgba(255,255,255,0.4);">Need glasses? Visit <a href="https://charmoptical.ca" style="color:var(--tertiary);text-decoration:underline;">Charm Optical</a> in Edmonton.</p>
      </div>
      <div class="footer-links">
        <div class="footer-col"><h4>Topics</h4><a href="/articles?cat=lenses">Lenses</a><a href="/articles?cat=frames">Frames</a><a href="/articles?cat=prescriptions">Prescriptions</a><a href="/articles?cat=coatings">Coatings</a></div>
        <div class="footer-col"><h4>More</h4><a href="/articles?cat=sunglasses">Sunglasses</a><a href="/articles?cat=eye-conditions">Eye Health</a><a href="/articles?cat=care">Care</a><a href="/articles?cat=buying-guide">Buying Guide</a></div>
        <div class="footer-col"><h4>Site</h4><a href="/about">About</a><a href="/articles">All Articles</a><a href="https://charmoptical.ca" target="_blank" rel="noopener">Charm Optical</a><a href="https://booking.charmoptical.ca" target="_blank" rel="noopener">Book Eye Exam</a></div>
      </div>
    </div>
    <div class="footer-bottom"><p>&copy; 2026 GlassesPedia. Content is for educational purposes. Visit <a href="https://charmoptical.ca" style="color:var(--tertiary);">Charm Optical in Edmonton</a> for eyewear services.</p></div>
  </footer>
  <script src="/js/icons.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`;

fs.writeFileSync('./articles.html', articlesPage, 'utf8');

// ──────────────────────────────────────────────
// 4. Rebuild sitemap — ONLY published URLs
// ──────────────────────────────────────────────
console.log(`\nStep 3: Rebuilding sitemap.xml (published only)...`);

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
xml += `  <url><loc>https://glassespedia.ca/</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
xml += `  <url><loc>https://glassespedia.ca/articles</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
xml += `  <url><loc>https://glassespedia.ca/about</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;

liveArticles.forEach(slug => {
  const spec = specMap[slug];
  const lastmod = spec ? spec.date : '2026-04-12';
  xml += `  <url><loc>https://glassespedia.ca/articles/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
});

xml += '</urlset>';
fs.writeFileSync('./sitemap.xml', xml);

// ──────────────────────────────────────────────
// 5. Summary
// ──────────────────────────────────────────────
console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║         BUILD COMPLETE — ${TODAY}          ║`);
console.log(`╠══════════════════════════════════════════════╣`);
console.log(`║  Live articles:     ${String(liveArticles.length).padStart(4)}                      ║`);
console.log(`║  Scheduled (future): ${String(scheduled.length).padStart(4)}                      ║`);
console.log(`║  Sitemap URLs:      ${String(liveArticles.length + 3).padStart(4)}                      ║`);
console.log(`║  Next publish date:  ${scheduled.length > 0 ? scheduled[0].date : 'none'}                 ║`);
console.log(`╚══════════════════════════════════════════════╝`);

if (scheduled.length > 0) {
  console.log(`\nUpcoming (next 7 days):`);
  const weekFromNow = new Date(TODAY);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekStr = weekFromNow.toISOString().split('T')[0];
  scheduled.filter(s => s.date <= weekStr).forEach(s => {
    console.log(`  ${s.date} | ${s.title}`);
  });
}
