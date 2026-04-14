#!/usr/bin/env node
/**
 * Add academic/medical sources to each article based on category and topic.
 * Sources are real, authoritative, non-competitor websites.
 * Each article gets 3-5 sources from a curated pool.
 */

const fs = require('fs');
const path = require('path');

// ── Curated academic source pools by category ──────────────────────
const SOURCES = {
  lenses: [
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/get-your-eyes-examined', desc: 'Eye health and vision correction resources' },
    { name: 'American Academy of Ophthalmology — EyeSmart', url: 'https://www.aao.org/eye-health', desc: 'Peer-reviewed eye health information' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian guidelines on vision care' },
    { name: 'American Optometric Association — Lenses', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eyeglasses', desc: 'Lens types, coatings, and fitting guidance' },
    { name: 'The Vision Council', url: 'https://thevisioncouncil.org/consumers', desc: 'Optical industry research and consumer education' },
    { name: 'Review of Optometry', url: 'https://www.reviewofoptometry.com', desc: 'Clinical optometry journal' },
    { name: 'College of Optometrists (UK)', url: 'https://www.college-optometrists.org/clinical-guidance', desc: 'Evidence-based clinical guidance on lens prescriptions' },
    { name: 'World Health Organization — Vision', url: 'https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment', desc: 'Global vision impairment statistics and prevention' },
    { name: 'Mayo Clinic — Eye Care', url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/eyeglasses/art-20047879', desc: 'Medical guidance on corrective lenses' },
    { name: 'Alberta Association of Optometrists', url: 'https://www.optometrists.ab.ca/patients', desc: 'Alberta-specific vision care and coverage information' },
  ],
  frames: [
    { name: 'The Vision Council — Eyewear Trends', url: 'https://thevisioncouncil.org/consumers', desc: 'Annual eyewear market data and consumer trends' },
    { name: 'American Academy of Ophthalmology — Eyeglasses', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglasses', desc: 'Guide to choosing the right frames' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian standards for eyewear quality and fitting' },
    { name: 'American Optometric Association', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eyeglasses', desc: 'Professional guidance on frame selection' },
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health', desc: 'NIH eye health education resources' },
    { name: 'Optometry and Vision Science Journal', url: 'https://journals.lww.com/optvissci', desc: 'Peer-reviewed research on optical science' },
    { name: 'British Journal of Ophthalmology', url: 'https://bjo.bmj.com', desc: 'International ophthalmology research journal' },
    { name: 'Alberta Association of Optometrists', url: 'https://www.optometrists.ab.ca/patients', desc: 'Alberta eye care patient resources' },
  ],
  prescriptions: [
    { name: 'American Academy of Ophthalmology — Understanding Prescriptions', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglass-prescription', desc: 'How to read your eye prescription' },
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/refractive-errors', desc: 'Refractive errors explained (myopia, hyperopia, astigmatism)' },
    { name: 'American Optometric Association — Vision Conditions', url: 'https://www.aoa.org/healthy-eyes/eye-and-vision-conditions', desc: 'Common vision conditions and prescriptions' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Understanding your prescription in Canada' },
    { name: 'Mayo Clinic — Refractive Errors', url: 'https://www.mayoclinic.org/diseases-conditions/nearsightedness/symptoms-causes/syc-20375556', desc: 'Medical overview of common refractive conditions' },
    { name: 'College of Optometrists (UK)', url: 'https://www.college-optometrists.org/clinical-guidance', desc: 'Clinical guidance on prescribing standards' },
    { name: 'World Council of Optometry', url: 'https://worldcouncilofoptometry.info', desc: 'Global standards for optometric practice' },
  ],
  coatings: [
    { name: 'American Academy of Ophthalmology — Lens Coatings', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglass-lens-coatings', desc: 'Overview of anti-reflective, scratch-resistant, and UV coatings' },
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health', desc: 'UV protection and eye health' },
    { name: 'American Optometric Association — UV Protection', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/uv-protection', desc: 'UV radiation and eye protection guidelines' },
    { name: 'The Vision Council — UV & Blue Light', url: 'https://thevisioncouncil.org/consumers', desc: 'Research on UV exposure and digital eye strain' },
    { name: 'Optometry and Vision Science Journal', url: 'https://journals.lww.com/optvissci', desc: 'Peer-reviewed lens coating research' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian guidance on protective lens coatings' },
  ],
  'eye-conditions': [
    { name: 'National Eye Institute — Eye Conditions', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases', desc: 'Comprehensive database of eye diseases and conditions' },
    { name: 'Mayo Clinic — Eye Diseases', url: 'https://www.mayoclinic.org/diseases-conditions', desc: 'Medical guidance on eye conditions' },
    { name: 'American Academy of Ophthalmology — Eye Health A-Z', url: 'https://www.aao.org/eye-health/diseases', desc: 'Peer-reviewed disease information from ophthalmologists' },
    { name: 'Cleveland Clinic — Eye Care', url: 'https://my.clevelandclinic.org/health/articles/eye-care', desc: 'Patient education on eye conditions and treatments' },
    { name: 'World Health Organization — Vision Impairment', url: 'https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment', desc: 'Global prevalence of vision conditions' },
    { name: 'Canadian Ophthalmological Society', url: 'https://www.cos-sco.ca/patients-public/', desc: 'Canadian resources for eye disease prevention' },
    { name: 'Prevent Blindness', url: 'https://preventblindness.org', desc: 'Non-profit eye health education and research' },
    { name: 'PubMed Central — Ophthalmology', url: 'https://www.ncbi.nlm.nih.gov/pmc/?term=ophthalmology', desc: 'Open-access medical research database' },
  ],
  care: [
    { name: 'American Academy of Ophthalmology — Eye Care Tips', url: 'https://www.aao.org/eye-health/tips-prevention', desc: 'Preventive eye care guidance from ophthalmologists' },
    { name: 'National Eye Institute — Healthy Vision', url: 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision', desc: 'NIH resources on maintaining healthy vision' },
    { name: 'American Optometric Association — Caring for Eyes', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes', desc: 'Daily eye care best practices' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian eye care recommendations' },
    { name: 'Mayo Clinic — Eye Care', url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/eyeglasses/art-20047879', desc: 'Medical advice on eyewear maintenance and eye health' },
    { name: 'Prevent Blindness', url: 'https://preventblindness.org', desc: 'Eye safety and injury prevention resources' },
    { name: 'Canadian Ophthalmological Society', url: 'https://www.cos-sco.ca/patients-public/', desc: 'Professional eye care standards in Canada' },
  ],
  'buying-guide': [
    { name: 'Federal Trade Commission — Eyeglass Rule', url: 'https://www.ftc.gov/legal-library/browse/rules/eyeglass-rule', desc: 'Consumer rights for prescription eyewear purchases' },
    { name: 'The Vision Council', url: 'https://thevisioncouncil.org/consumers', desc: 'Optical industry standards and consumer education' },
    { name: 'American Academy of Ophthalmology — Buying Glasses', url: 'https://www.aao.org/eye-health/glasses-contacts/eyeglasses', desc: 'What to look for when buying eyeglasses' },
    { name: 'American Optometric Association', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eyeglasses', desc: 'Professional tips for choosing the right eyewear' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Eye care standards and provider finding in Canada' },
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health', desc: 'Eye health fundamentals for informed purchasing' },
    { name: 'Alberta Association of Optometrists', url: 'https://www.optometrists.ab.ca/patients', desc: 'Alberta-specific eye care coverage and providers' },
    { name: 'Government of Alberta — Health Benefits', url: 'https://www.alberta.ca/health-benefits', desc: 'Provincial health coverage for vision care' },
  ],
  sunglasses: [
    { name: 'American Academy of Ophthalmology — Sunglasses', url: 'https://www.aao.org/eye-health/glasses-contacts/sunglasses', desc: 'UV protection guidelines for sunglasses' },
    { name: 'American Optometric Association — UV Protection', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/uv-protection', desc: 'How UV radiation affects eyes and proper protection' },
    { name: 'The Vision Council — UV & Sun Safety', url: 'https://thevisioncouncil.org/consumers', desc: 'Research on sun exposure and protective eyewear' },
    { name: 'National Eye Institute', url: 'https://www.nei.nih.gov/learn-about-eye-health', desc: 'NIH guidance on sun and eye health' },
    { name: 'World Health Organization — UV Radiation', url: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation', desc: 'Global UV radiation data and health effects' },
    { name: 'Skin Cancer Foundation — Eye Protection', url: 'https://www.skincancerfoundation.org/skin-cancer-prevention/sun-protection/sunglasses', desc: 'Sunglass standards for UV and skin cancer prevention' },
    { name: 'Canadian Association of Optometrists', url: 'https://opto.ca/eye-health', desc: 'Canadian sunglass standards and recommendations' },
  ],
};

// ── Topic-specific bonus sources ──────────────────────
// If the article slug or title contains these keywords, add bonus sources
const TOPIC_BONUSES = [
  { keywords: ['blue.light', 'computer', 'digital.strain', 'screen'], sources: [
    { name: 'American Academy of Ophthalmology — Digital Eye Strain', url: 'https://www.aao.org/eye-health/tips-prevention/computer-usage', desc: 'Evidence-based guidance on screens and eye health' },
    { name: 'The Vision Council — Digital Eye Strain Report', url: 'https://thevisioncouncil.org/consumers', desc: 'Annual research on digital device usage and vision' },
  ]},
  { keywords: ['kid', 'child', 'pediatric'], sources: [
    { name: 'American Association for Pediatric Ophthalmology', url: 'https://aapos.org/glossary', desc: 'Pediatric eye care guidelines and conditions' },
    { name: 'Canadian Paediatric Society', url: 'https://caringforkids.cps.ca/handouts/health-conditions-and-treatments/your_childs_eyes', desc: 'Children\'s eye health information for parents' },
  ]},
  { keywords: ['presbyopia', 'progressive', 'bifocal', 'reading.glass', 'multifocal'], sources: [
    { name: 'American Academy of Ophthalmology — Presbyopia', url: 'https://www.aao.org/eye-health/diseases/what-is-presbyopia', desc: 'Medical overview of age-related near vision loss' },
  ]},
  { keywords: ['astigmatism'], sources: [
    { name: 'National Eye Institute — Astigmatism', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/astigmatism', desc: 'NIH guide to astigmatism causes and correction' },
  ]},
  { keywords: ['myopia', 'nearsight', 'short.sight'], sources: [
    { name: 'International Myopia Institute', url: 'https://myopiainstitute.org', desc: 'Global research consortium on myopia prevention and management' },
    { name: 'National Eye Institute — Myopia', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/nearsightedness-myopia', desc: 'NIH myopia overview and research' },
  ]},
  { keywords: ['color.blind', 'colour.blind'], sources: [
    { name: 'National Eye Institute — Color Blindness', url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/color-blindness', desc: 'Types, causes, and testing for color vision deficiency' },
  ]},
  { keywords: ['photochromic', 'transition', 'light.adapt'], sources: [
    { name: 'American Academy of Ophthalmology — Photochromic Lenses', url: 'https://www.aao.org/eye-health/glasses-contacts/photochromic-lenses', desc: 'How photochromic lens technology works' },
  ]},
  { keywords: ['polarize'], sources: [
    { name: 'American Academy of Ophthalmology — Polarized Lenses', url: 'https://www.aao.org/eye-health/glasses-contacts/polarized-lenses', desc: 'Benefits and limitations of polarized lenses' },
  ]},
  { keywords: ['contact.lens'], sources: [
    { name: 'American Academy of Ophthalmology — Contact Lenses', url: 'https://www.aao.org/eye-health/glasses-contacts/contact-lenses', desc: 'Contact lens types, care, and safety' },
    { name: 'FDA — Contact Lens Safety', url: 'https://www.fda.gov/medical-devices/contact-lenses/contact-lens-risks', desc: 'FDA guidance on contact lens safety and compliance' },
  ]},
  { keywords: ['night.driv', 'glare', 'anti.glare'], sources: [
    { name: 'American Academy of Ophthalmology — Night Vision', url: 'https://www.aao.org/eye-health/tips-prevention/night-vision-driving', desc: 'Tips for safe night driving and glare reduction' },
  ]},
  { keywords: ['scratch', 'repair', 'clean', 'maintain'], sources: [
    { name: 'American Optometric Association — Eyeglass Care', url: 'https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eyeglasses', desc: 'Proper cleaning and maintenance of eyeglasses' },
  ]},
];

// ── Helper: pick N random items from array ──────────────────────
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Main ──────────────────────
const contentDir = './content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));

let updated = 0;

files.forEach(file => {
  const filePath = path.join(contentDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const cat = data.category || 'buying-guide';
  const slug = data.slug || '';
  const title = (data.title || '').toLowerCase();
  const searchText = slug + ' ' + title;

  // Get category pool
  const catPool = SOURCES[cat] || SOURCES['buying-guide'];

  // Find topic bonuses
  let bonusSources = [];
  TOPIC_BONUSES.forEach(tb => {
    if (tb.keywords.some(kw => new RegExp(kw, 'i').test(searchText))) {
      bonusSources.push(...tb.sources);
    }
  });

  // Deduplicate bonuses vs pool (by URL)
  const poolUrls = new Set(catPool.map(s => s.url));
  const uniqueBonuses = bonusSources.filter(s => !poolUrls.has(s.url));

  // Pick 2-3 from category pool + 1-2 bonuses (total 3-5)
  const fromPool = pickRandom(catPool, uniqueBonuses.length > 0 ? 3 : 4);
  const fromBonus = pickRandom(uniqueBonuses, Math.min(2, uniqueBonuses.length));

  const sources = [...fromPool, ...fromBonus];

  // Deduplicate by URL
  const seen = new Set();
  data.academicSources = sources.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  updated++;
  console.log(`${file}: ${data.academicSources.length} sources added (${cat})`);
});

console.log(`\nDone. Added academic sources to ${updated} files.`);
