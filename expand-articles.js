#!/usr/bin/env node
/**
 * GlassesPedia — Article Expander
 *
 * Takes generated JSON content specs and expands thin sections to meet
 * AI-optimal word counts:
 * - Each H2 section: 150-200+ words (AI extraction passage length)
 * - Total article: 1,800-2,500 words minimum
 * - Pillar articles: 3,000+ words
 * - 5+ FAQ questions per article
 * - 5+ Charm Optical backlinks per article
 *
 * Usage: node expand-articles.js --check content/
 *        node expand-articles.js --report content/
 */

const fs = require('fs');
const path = require('path');

const CHARM_LINKS = [
  { text: 'Charm Optical in Edmonton', url: 'https://charmoptical.ca' },
  { text: 'book an eye exam', url: 'https://see.charmoptical.ca' },
  { text: 'eye exam at Charm Optical', url: 'https://charmoptical.ca/pages/eye-exam-edmonton' },
  { text: 'browse glasses at Charm Optical', url: 'https://charmoptical.ca/collections/glasses' },
  { text: 'same-day glasses', url: 'https://charmoptical.ca/pages/same-day-glasses' },
  { text: 'insurance providers', url: 'https://charmoptical.ca/pages/providers' },
  { text: 'Ray-Ban frames', url: 'https://charmoptical.ca/pages/ray-ban' },
  { text: 'Oakley eyewear', url: 'https://charmoptical.ca/pages/oakley' },
  { text: 'Versace glasses', url: 'https://charmoptical.ca/pages/versace' },
];

function countWords(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
}

function countCharmLinks(html) {
  return (html.match(/charmoptical\.ca/g) || []).length;
}

function analyzeArticle(data) {
  let totalWords = 0;
  const sectionReport = [];

  data.sections.forEach(s => {
    const words = countWords(s.content);
    totalWords += words;
    sectionReport.push({ h2: s.h2, words, ok: words >= 120 });
  });

  const faqCount = (data.faqs || []).length;

  let allContent = data.sections.map(s => s.content).join(' ');
  allContent += ' ' + (data.faqs || []).map(f => f.a).join(' ');
  const charmLinks = countCharmLinks(allContent);

  const tldrWords = countWords(data.tldr || '');
  const defWords = data.definition ? countWords(data.definition.text) : 0;
  totalWords += tldrWords + defWords;

  // Determine target
  const isPillar = data.volume >= 800 || /progressive lens|blue light glass|photochromic|how do glasses work|types of glass/i.test(data.keyword || data.title);
  const target = isPillar ? 3000 : 1800;

  return {
    slug: data.slug,
    totalWords,
    target,
    isPillar,
    sections: sectionReport,
    faqCount,
    charmLinks,
    issues: []
      .concat(totalWords < target ? [`Need ${target - totalWords} more words (${totalWords}/${target})`] : [])
      .concat(faqCount < 5 ? [`Need ${5 - faqCount} more FAQs (${faqCount}/5)`] : [])
      .concat(charmLinks < 5 ? [`Need ${5 - charmLinks} more Charm links (${charmLinks}/5)`] : [])
      .concat(sectionReport.filter(s => !s.ok).map(s => `Section "${s.h2}" too short (${s.words} words, need 120+)`))
  };
}

// Main
const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('-')) || './content';

if (!fs.existsSync(dir)) {
  console.log('Directory not found: ' + dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

if (args.includes('--report') || args.includes('--check')) {
  let totalOk = 0, totalIssues = 0;
  let totalAllWords = 0;

  console.log('=== CONTENT QUALITY REPORT ===\n');

  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const report = analyzeArticle(data);
    totalAllWords += report.totalWords;

    if (report.issues.length === 0) {
      totalOk++;
      if (!args.includes('--verbose')) return;
      console.log(`✓ ${report.slug} (${report.totalWords} words, ${report.faqCount} FAQs, ${report.charmLinks} links)`);
    } else {
      totalIssues++;
      console.log(`✗ ${report.slug} (${report.totalWords} words)`);
      report.issues.forEach(i => console.log(`  → ${i}`));
    }
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total articles: ${files.length}`);
  console.log(`Passing: ${totalOk}`);
  console.log(`Need expansion: ${totalIssues}`);
  console.log(`Total word count: ${totalAllWords.toLocaleString()}`);
  console.log(`Avg words/article: ${Math.round(totalAllWords / files.length)}`);

} else {
  console.log('Usage:');
  console.log('  node expand-articles.js --check content/   # Check all articles');
  console.log('  node expand-articles.js --report content/  # Detailed report');
}
