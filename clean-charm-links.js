#!/usr/bin/env node
/**
 * Clean Charm Optical links from article content.
 * Keeps max 3 inline links per article (+ 1 CTA box = 4 total per page).
 * Removes the <a> tag but preserves the link text.
 */

const fs = require('fs');
const path = require('path');

const contentDir = './content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));

let totalCleaned = 0;

files.forEach(file => {
  const filePath = path.join(contentDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Count all charm links across all sections
  let charmLinkCount = 0;
  let keptCount = 0;
  const MAX_INLINE = 3; // 3 inline + 1 CTA box = 4 per page

  if (!data.sections) return;

  data.sections.forEach((section, sIdx) => {
    if (!section.content) return;

    // Find all <a> tags linking to charmoptical.ca or see.charmoptical.ca or booking.charmoptical.ca
    section.content = section.content.replace(
      /<a\s+[^>]*href="https?:\/\/(?:www\.)?(?:see\.|booking\.)?charmoptical\.ca[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
      (match, innerText) => {
        charmLinkCount++;
        if (keptCount < MAX_INLINE) {
          keptCount++;
          return match; // Keep this one
        }
        // Strip the link, keep the text
        return innerText;
      }
    );
  });

  // Also clean FAQs — remove charm links from FAQ answers (those should be pure info)
  if (data.faqs) {
    data.faqs.forEach(faq => {
      // Remove the last FAQ if it's just a "where to get glasses in Edmonton" promo
      faq.a = faq.a.replace(
        /<a\s+[^>]*href="https?:\/\/(?:www\.)?(?:see\.|booking\.)?charmoptical\.ca[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
        (match, innerText) => innerText
      );
    });
  }

  // Remove the last FAQ if it's purely promotional
  if (data.faqs && data.faqs.length > 0) {
    const lastFaq = data.faqs[data.faqs.length - 1];
    if (lastFaq.q && /where can i (get|buy|find) (glasses|eyewear|frames)/i.test(lastFaq.q)) {
      data.faqs.pop();
    }
  }

  if (charmLinkCount > MAX_INLINE) {
    const removed = charmLinkCount - keptCount;
    console.log(`${file}: ${charmLinkCount} charm links → kept ${keptCount}, removed ${removed}`);
    totalCleaned += removed;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } else {
    console.log(`${file}: ${charmLinkCount} charm links — OK`);
  }
});

console.log(`\nDone. Cleaned ${totalCleaned} excess charm links across ${files.length} files.`);
