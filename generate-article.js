#!/usr/bin/env node
/**
 * GlassesPedia — Article Generator v2
 *
 * Generates a complete HTML article with:
 * - TL;DR box with stat grid
 * - AI Definition block
 * - Visual bar charts, stat cards, feature lists, pros/cons
 * - Charm Optical callouts throughout
 * - FAQ accordion with schema
 * - Related articles
 * - Full structured data (Article, FAQ, Speakable, DefinedTerm, HowTo)
 *
 * Usage:
 *   node generate-article.js <content-file.json>
 *   node generate-article.js --batch <directory>
 *
 * Content spec (JSON):
 * {
 *   "slug": "progressive-lenses-cost-canada",
 *   "title": "Progressive Lenses Cost in Canada: 2026 Price Guide",
 *   "description": "How much do progressive lenses cost in Canada?...",
 *   "category": "lenses",
 *   "readTime": "8 min",
 *   "date": "2026-04-15",
 *   "tldr": "Quick summary sentence for TL;DR box",
 *   "tldrStats": [{ "value": "$200+", "label": "Starting Cost" }],
 *   "definition": { "term": "Progressive Lenses", "text": "Multifocal lenses that..." },
 *   "sections": [{ "h2": "Section Title", "content": "<p>HTML content...</p>" }],
 *   "charmCallouts": [{ "icon": "glasses", "title": "Browse at Charm Optical", "text": "500+ frames...", "link": "https://charmoptical.ca/collections/glasses" }],
 *   "faqs": [{ "q": "Question?", "a": "Answer." }],
 *   "related": [{ "slug": "progressive-lenses", "cat": "Lenses", "title": "Progressive Guide" }],
 *   "ctaTitle": "Need This?",
 *   "ctaText": "Charm Optical in South Edmonton...",
 *   "ctaLink": "https://charmoptical.ca",
 *   "ctaButtonText": "Visit Charm Optical"
 * }
 */

const fs = require('fs');
const path = require('path');

function esc(s) { return (s || '').replace(/"/g, '\\"').replace(/\n/g, ' '); }
function capitalize(s) { return (s || '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function formatDate(d) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [y, m] = d.split('-');
  return months[parseInt(m) - 1] + ' ' + y;
}

const TEMPLATE = (d) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${d.title} — GlassesPedia</title>
  <meta name="description" content="${esc(d.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://glassespedia.ca/articles/${d.slug}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(d.title)}">
  <meta property="og:description" content="${esc(d.description)}">
  <meta property="og:url" content="https://glassespedia.ca/articles/${d.slug}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "${esc(d.title)}",
        "description": "${esc(d.description)}",
        "datePublished": "${d.date}",
        "dateModified": "${d.date}",
        "publisher": { "@type": "Organization", "name": "GlassesPedia", "url": "https://glassespedia.ca" },
        "author": { "@type": "Organization", "name": "GlassesPedia Editorial Team" },
        "mainEntityOfPage": "https://glassespedia.ca/articles/${d.slug}"${d.definition ? `,
        "about": { "@type": "DefinedTerm", "name": "${esc(d.definition.term)}", "description": "${esc(d.definition.text)}" }` : ''}
      }${d.faqs && d.faqs.length ? `,
      {
        "@type": "FAQPage",
        "mainEntity": [${d.faqs.map(f => `
          { "@type": "Question", "name": "${esc(f.q)}", "acceptedAnswer": { "@type": "Answer", "text": "${esc(f.a)}" } }`).join(',')}
        ]
      }` : ''},
      {
        "@type": "WebPage",
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr", ".ai-definition", ".faq-answer-inner"] }
      }
    ]
  }
  </script>
</head>
<body>
  <nav class="nav" id="nav">
    <a href="/" class="nav-logo">GP</a>
    <div class="nav-center" id="navLinks">
      <a href="/#gallery">Explore</a>
      <a href="/#topics">Topics</a>
      <a href="/#reads">Articles</a>
      <a href="/about">About</a>
    </div>
    <button class="nav-toggle" id="menuBtn" aria-label="Toggle menu"><span></span><span></span></button>
  </nav>

  <main class="article-page">
    <div class="container">
      <div class="article-breadcrumb">
        <a href="/">Home</a> <span>/</span> <a href="/articles">Articles</a> <span>/</span> <a href="/articles?cat=${d.category}">${capitalize(d.category)}</a> <span>/</span> <span>${d.title.split(':')[0]}</span>
      </div>

      <!-- TL;DR -->
      <div class="tldr">
        <p>${d.tldr || d.description}</p>${d.tldrStats && d.tldrStats.length ? `
        <div class="tldr-grid">${d.tldrStats.map(s => `
          <div class="tldr-stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join('')}
        </div>` : ''}
      </div>
${d.definition ? `
      <!-- AI Definition -->
      <dl class="ai-definition">
        <dt>${d.definition.term}</dt>
        <dd>${d.definition.text}</dd>
      </dl>
` : ''}
      <h1>${d.title}</h1>
      <div class="article-meta">
        <span>${capitalize(d.category)}</span>
        <span>${d.readTime} read</span>
        <span>${formatDate(d.date)}</span>
        <span>Reviewed by opticians</span>
      </div>

      <a href="https://charmoptical.ca/collections/glasses" target="_blank" rel="noopener" class="charm-callout">
        <span class="gp-icon" data-icon="glasses" data-color="violet"></span>
        <div class="charm-callout-text">
          <h4>Find eyewear like this at Charm Optical</h4>
          <p>500+ designer frames in South Edmonton. Same-day glasses available. Direct insurance billing.</p>
        </div>
        <span class="charm-callout-arrow">&rarr;</span>
      </a>

      <div class="toc" id="autoToc"><h4>In This Article</h4></div>

      <article class="article-content">
${d.sections.map(s => `
        <h2>${s.h2}</h2>
${s.content}
`).join('\n')}
${d.ctaTitle ? `
        <div class="cta-box">
          <h4>${d.ctaTitle}</h4>
          <p>${d.ctaText}</p>
          <a href="${d.ctaLink}" class="btn-primary" target="_blank" rel="noopener">${d.ctaButtonText} <span class="btn-icon">&rarr;</span></a>
        </div>
` : `
        <div class="cta-box">
          <h4>Need Eyewear?</h4>
          <p>Charm Optical in South Edmonton carries premium lenses and 500+ designer frames. Direct insurance billing for most Alberta providers.</p>
          <a href="https://charmoptical.ca" class="btn-primary" target="_blank" rel="noopener">Visit Charm Optical <span class="btn-icon">&rarr;</span></a>
        </div>
`}
${d.faqs && d.faqs.length ? `
        <div class="faq-section">
          <h2>Frequently Asked Questions</h2>
${d.faqs.map(f => `          <div class="faq-item">
            <button class="faq-question">${f.q}</button>
            <div class="faq-answer"><div class="faq-answer-inner">${f.a}</div></div>
          </div>`).join('\n')}
        </div>
` : ''}
${d.related && d.related.length ? `
        <div class="related-articles">
          <h3>Keep Reading</h3>
          <div class="related-grid">
${d.related.map(r => `            <a href="/articles/${r.slug}" class="related-card"><span>${r.cat}</span><h4>${r.title}</h4></a>`).join('\n')}
          </div>
        </div>
` : ''}
      </article>
    </div>
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

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('GlassesPedia Article Generator v2');
  console.log('Usage: node generate-article.js <content-file.json>');
  console.log('       node generate-article.js --batch <directory>');
  process.exit(0);
}

if (args[0] === '--batch') {
  const dir = args[1] || './content';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const html = TEMPLATE(data);
    fs.writeFileSync(path.join('./articles', data.slug + '.html'), html, 'utf8');
    console.log('Generated: articles/' + data.slug + '.html');
  });
  console.log('\nBatch complete: ' + files.length + ' articles.');
} else {
  const data = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  const html = TEMPLATE(data);
  const outPath = path.join('./articles', data.slug + '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Generated: ' + outPath);
}
