#!/usr/bin/env node
/**
 * Patch the 24 original pre-built articles:
 * 1. Reduce inline Charm Optical links to max 3 in article body
 * 2. Remove the charm-callout banner
 * 3. Inject academic sources section before related-articles
 */

const fs = require('fs');
const path = require('path');

// Academic sources mapped by guessed category
const SOURCES_BY_CAT = {
  lenses: [
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/get-your-eyes-examined', desc: 'Eye health and vision correction resources' },
    { name: 'American Academy of Ophthalmology — EyeSmart', url: 'https://www.aao.org/eye-health', desc: 'Peer-reviewed eye health information' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian guidelines on vision care' },
    { name: 'American Optometric Association', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eyeglasses', desc: 'Professional lens and eyeglass guidance' },
  ],
  frames: [
    { name: 'The Vision Council', url: 'https://thevisioncouncil.org/consumers', desc: 'Eyewear market data and consumer trends' },
    { name: 'American Academy of Ophthalmology — Eyeglasses', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglasses', desc: 'Guide to choosing the right frames' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian eyewear standards and fitting' },
    { name: 'British Journal of Ophthalmology', url: 'https://bjo.bmj.com', desc: 'International ophthalmology research' },
  ],
  prescriptions: [
    { name: 'American Academy of Ophthalmology — Prescriptions', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglass-prescription', desc: 'How to read your eye prescription' },
    { name: 'National Eye Institute — Refractive Errors', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/refractive-errors', desc: 'Myopia, hyperopia, and astigmatism explained' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Understanding prescriptions in Canada' },
    { name: 'Mayo Clinic — Refractive Errors', url: 'https://www.mayoclinic.org/diseases-conditions/nearsightedness/symptoms-causes/syc-20375556', desc: 'Medical overview of common refractive conditions' },
  ],
  'eye-conditions': [
    { name: 'National Eye Institute — Eye Conditions', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases', desc: 'Comprehensive eye disease database' },
    { name: 'Mayo Clinic — Eye Diseases', url: 'https://www.mayoclinic.org/diseases-conditions', desc: 'Medical guidance on eye conditions' },
    { name: 'American Academy of Ophthalmology — Eye Health A-Z', url: 'https://www.aao.org/eye-health/diseases', desc: 'Peer-reviewed disease information' },
    { name: 'Canadian Ophthalmological Society', url: 'https://www.cos-sco.ca/patients-public/', desc: 'Canadian eye disease prevention resources' },
  ],
  care: [
    { name: 'American Academy of Ophthalmology — Eye Care Tips', url: 'https://www.aao.org/eye-health/tips-prevention', desc: 'Preventive eye care from ophthalmologists' },
    { name: 'National Eye Institute — Healthy Vision', url: 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision', desc: 'NIH resources on maintaining healthy vision' },
    { name: 'American Optometric Association — Caring for Eyes', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes', desc: 'Daily eye care best practices' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian eye care recommendations' },
  ],
  'buying-guide': [
    { name: 'Federal Trade Commission — Eyeglass Rule', url: 'https://www.ftc.gov/legal-library/browse/rules/eyeglass-rule', desc: 'Consumer rights for prescription eyewear' },
    { name: 'The Vision Council', url: 'https://thevisioncouncil.org/consumers', desc: 'Optical industry standards and education' },
    { name: 'American Academy of Ophthalmology', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglasses', desc: 'What to look for when buying eyeglasses' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian eye care standards' },
  ],
};

// Topic-specific bonus sources
const TOPIC_MAP = {
  'blue-light': { name: 'American Academy of Ophthalmology — Digital Eye Strain', url: 'https://www.aao.org/eye-health/tips-prevention/computer-usage', desc: 'Evidence-based guidance on screens and eye health' },
  'computer': { name: 'The Vision Council — Digital Eye Strain Report', url: 'https://thevisioncouncil.org/consumers', desc: 'Research on digital device usage and vision' },
  'astigmatism': { name: 'National Eye Institute — Astigmatism', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/astigmatism', desc: 'NIH guide to astigmatism causes and correction' },
  'progressive': { name: 'American Academy of Ophthalmology — Presbyopia', url: 'https://www.aao.org/eye-health/diseases/what-is-presbyopia', desc: 'Medical overview of age-related near vision loss' },
  'bifocal': { name: 'American Academy of Ophthalmology — Presbyopia', url: 'https://www.aao.org/eye-health/diseases/what-is-presbyopia', desc: 'Presbyopia and multifocal lens options' },
  'color-blind': { name: 'National Eye Institute — Color Blindness', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness', desc: 'Types, causes, and testing for color vision deficiency' },
  'photochromic': { name: 'American Academy of Ophthalmology — Photochromic Lenses', url: 'https://www.aao.org/eye-health/glasses-contacts/photochromic-lenses', desc: 'How photochromic lens technology works' },
  'polarized': { name: 'American Academy of Ophthalmology — Polarized Lenses', url: 'https://www.aao.org/eye-health/glasses-contacts/polarized-lenses', desc: 'Benefits and limitations of polarized lenses' },
  'kids': { name: 'American Association for Pediatric Ophthalmology', url: 'https://aapos.org/glossary', desc: 'Pediatric eye care guidelines' },
  'night-driving': { name: 'American Academy of Ophthalmology — Night Vision', url: 'https://www.aao.org/eye-health/tips-prevention/night-vision-driving', desc: 'Tips for safe night driving and glare reduction' },
  'reading': { name: 'National Eye Institute — Presbyopia', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/presbyopia', desc: 'Age-related near vision changes' },
  'motion-sickness': { name: 'Mayo Clinic — Motion Sickness', url: 'https://www.mayoclinic.org/diseases-conditions/motion-sickness/symptoms-causes/syc-20374628', desc: 'Medical overview of motion sickness causes and treatments' },
};

function guessCat(slug) {
  if (/frame|rimless|aviator|cat-eye|horn|square|round/i.test(slug)) return 'frames';
  if (/prescription|pd|axis/i.test(slug)) return 'prescriptions';
  if (/astigmat|color-blind|motion-sickness/i.test(slug)) return 'eye-conditions';
  if (/clean|fix|repair|adjust|scratch|slide|care/i.test(slug)) return 'care';
  if (/buy|cost|price|best|where|online/i.test(slug)) return 'buying-guide';
  return 'lenses';
}

function getSources(slug) {
  const cat = guessCat(slug);
  let sources = [...(SOURCES_BY_CAT[cat] || SOURCES_BY_CAT.lenses)];

  // Add topic-specific bonus
  for (const [key, src] of Object.entries(TOPIC_MAP)) {
    if (slug.includes(key) && !sources.some(s => s.url === src.url)) {
      sources.push(src);
      break; // max 1 bonus
    }
  }

  return sources.slice(0, 5);
}

function buildSourcesHtml(sources) {
  const items = sources.map(s =>
    `            <li><a href="${s.url}" target="_blank" rel="noopener nofollow">${s.name}</a> — ${s.desc}</li>`
  ).join('\n');

  return `
        <div class="sources-section">
          <h3>Sources &amp; Further Reading</h3>
          <ul class="sources-list">
${items}
          </ul>
        </div>
`;
}

// ── Find originals ──────────────────────
const specSlugs = new Set(
  fs.readdirSync('./content').filter(f => f.endsWith('.json')).map(f => {
    const d = JSON.parse(fs.readFileSync(path.join('content', f), 'utf8'));
    return d.slug;
  })
);

const originals = fs.readdirSync('./articles')
  .filter(f => f.endsWith('.html'))
  .map(f => f.replace('.html', ''))
  .filter(slug => !specSlugs.has(slug));

console.log(`Patching ${originals.length} original articles...\n`);

originals.forEach(slug => {
  const filePath = path.join('articles', slug + '.html');
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Remove the charm-callout banner (any variant)
  html = html.replace(
    /<a\s+[^>]*class="charm-callout"[\s\S]*?<\/a>/,
    ''
  );

  // 2. Reduce Charm links in article-content to max 3
  // Split at article-content boundaries to only modify the article body
  const contentMatch = html.match(/(<article class="article-content">)([\s\S]*?)(<\/article>)/);
  if (contentMatch) {
    let articleBody = contentMatch[2];
    let kept = 0;
    const MAX = 3;

    articleBody = articleBody.replace(
      /<a\s+[^>]*href="https?:\/\/(?:www\.)?(?:see\.|booking\.)?charmoptical\.ca[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
      (match, innerText) => {
        kept++;
        if (kept <= MAX) return match;
        return innerText;
      }
    );

    html = html.replace(contentMatch[0], contentMatch[1] + articleBody + contentMatch[3]);
    console.log(`  ${slug}: kept ${Math.min(kept, MAX)}/${kept} charm links in body`);
  }

  // 3. Inject sources section before related-articles (or before </article>)
  const sources = getSources(slug);
  const sourcesHtml = buildSourcesHtml(sources);

  // Remove existing sources section if re-running
  html = html.replace(/\s*<div class="sources-section">[\s\S]*?<\/div>\s*/g, '\n');

  if (html.includes('<div class="related-articles">')) {
    html = html.replace('<div class="related-articles">', sourcesHtml + '\n        <div class="related-articles">');
    console.log(`  ${slug}: injected ${sources.length} sources (before related)`);
  } else if (html.includes('</article>')) {
    html = html.replace('</article>', sourcesHtml + '\n      </article>');
    console.log(`  ${slug}: injected ${sources.length} sources (before </article>)`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
});

console.log(`\nDone. Patched ${originals.length} original articles.`);
