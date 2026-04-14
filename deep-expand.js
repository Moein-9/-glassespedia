#!/usr/bin/env node
/**
 * GlassesPedia — Deep Content Expander
 *
 * Takes thin article sections and expands each one to 150-200+ words
 * by adding educational depth, comparisons, practical advice, and
 * Charm Optical backlinks.
 *
 * Runs after agents write initial drafts.
 * Usage: node deep-expand.js content/
 */

const fs = require('fs');
const path = require('path');

function countWords(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
}

function countCharmLinks(text) {
  return (text.match(/charmoptical\.ca/g) || []).length;
}

// Deep expansion templates — add to any section that's too short
function expandSection(section, data) {
  const words = countWords(section.content);
  if (words >= 140) return section; // Already good enough

  const h2Lower = section.h2.toLowerCase();
  let extra = '';

  // Cost/price sections
  if (/cost|price|how much|afford|budget|worth|pay/i.test(h2Lower)) {
    extra = `
        <p>Pricing varies significantly depending on where you buy and what lens features you choose. In Canada, the total cost of a complete pair of glasses (frame + lenses) typically breaks down as follows: budget options start at $150-$250 for basic frames with standard single vision lenses. Mid-range options with anti-reflective coating and a name-brand frame run $300-$500. Premium designer frames with progressive or high-index lenses can reach $600-$900+. The biggest variable is usually the lens — a basic single vision lens costs far less than a digital freeform progressive with premium coatings.</p>

        <p>Insurance makes a significant difference. Most employer health plans in Alberta cover $200-$500 toward glasses every 1-2 years. <a href="https://charmoptical.ca/pages/providers">Charm Optical direct-bills most Alberta insurance providers</a> — Alberta Blue Cross, Canada Life, Desjardins, and more — so you only pay the difference at the counter. No paperwork, no reimbursement wait. <a href="https://see.charmoptical.ca">Book an eye exam</a> to get your prescription checked and learn exactly what your plan covers before you shop.</p>`;
  }
  // Comparison sections
  else if (/vs\.?|versus|compar|differ|which|better/i.test(h2Lower)) {
    extra = `
        <p>When comparing options, consider your daily routine and visual priorities rather than just price. The "best" choice is the one that matches how you actually use your eyes throughout the day. Someone who works on a computer for 8 hours has very different needs than someone who primarily drives or reads. An honest conversation with your optometrist about your daily visual demands will point you toward the right option far more effectively than online reviews.</p>

        <p>Keep in mind that you're not locked into one choice forever. Many people own multiple pairs for different situations — dedicated computer glasses for the office, progressives for daily wear, and prescription sunglasses for driving. <a href="https://charmoptical.ca/collections/glasses">Charm Optical carries 500+ frames</a> across every style and price point, making it easy to build a collection that covers all your visual needs. Their opticians can advise which lens types pair best with each frame style. <a href="https://charmoptical.ca/pages/same-day-glasses">Same-day glasses</a> are available for many single vision prescriptions.</p>`;
  }
  // How-to / fix / clean sections
  else if (/how to|step|fix|clean|adjust|repair|tight|loose|scratch|slide/i.test(h2Lower)) {
    extra = `
        <p>If you're uncomfortable making adjustments yourself, or if the issue persists after trying these steps, take your glasses to a professional. Optical stores have specialized tools designed specifically for eyewear — household tools like regular pliers can easily crack lenses or snap frame hinges. Most adjustments take less than five minutes in-store and are typically free of charge.</p>

        <p><a href="https://charmoptical.ca">Charm Optical in Edmonton</a> offers free adjustments and minor repairs for any glasses — even if you didn't buy them there. Their opticians can also check whether your frames are still aligned correctly with your prescription, which is especially important for progressive lenses where even small shifts affect vision quality. If your glasses need more than an adjustment, they carry replacement parts for most major brands and can often fix broken hinges, replace nose pads, and resurface temple tips on the spot.</p>`;
  }
  // "What is" / definition sections
  else if (/what (is|are)|mean|defin|explain|overview|introduc|understanding/i.test(h2Lower)) {
    extra = `
        <p>Understanding the terminology helps you make informed decisions when shopping for glasses and communicating with your eye care provider. Many people feel overwhelmed by the technical language used in optical stores — but the concepts are actually straightforward once you know what each term means. Don't hesitate to ask your optician to explain anything you're unsure about. A good optician takes the time to educate rather than just sell.</p>

        <p>At <a href="https://charmoptical.ca">Charm Optical in Edmonton</a>, the staff walks every patient through their options in plain language — no jargon, no pressure. Whether you're buying your first pair of glasses or upgrading to progressive lenses, they explain what each choice means for your vision and your budget. <a href="https://see.charmoptical.ca">Book an eye exam</a> to start with an up-to-date prescription, then take your time choosing frames and lenses with expert guidance.</p>`;
  }
  // Who needs / signs / symptoms sections
  else if (/who (need|should)|sign|symptom|when to|do i need|candidate/i.test(h2Lower)) {
    extra = `
        <p>If you're experiencing any of these signs regularly, it's worth getting a professional assessment rather than guessing. Many vision problems develop gradually — your brain compensates for declining vision so effectively that you may not notice the change until it's significant. A <a href="https://charmoptical.ca/pages/eye-exam-edmonton">comprehensive eye exam</a> can detect issues that self-assessment misses, including early signs of conditions like glaucoma and macular degeneration that have no symptoms in their early stages.</p>

        <p>The Canadian Association of Optometrists recommends eye exams every 1-2 years for adults. Children should be examined annually since vision problems can significantly impact learning and development. In Alberta, children under 18 receive coverage through Alberta Health. Adults with diabetes or a family history of eye disease should also get annual exams. <a href="https://see.charmoptical.ca">Book an appointment at Charm Optical</a> — they accept most <a href="https://charmoptical.ca/pages/providers">Alberta insurance providers</a> through direct billing.</p>`;
  }
  // Brand / style sections
  else if (/brand|style|popular|recommend|top|best|collection|fashion|trend/i.test(h2Lower)) {
    extra = `
        <p>The best way to evaluate frame styles is to try them on in person. Photos and online try-on tools give a rough idea, but they can't replicate how a frame feels on your face — the weight distribution, the temple pressure, and how the nose bridge sits. These comfort factors matter more than aesthetics for glasses you'll wear 12+ hours a day.</p>

        <p><a href="https://charmoptical.ca/collections/glasses">Charm Optical in Edmonton carries over 500 frames</a> from brands including <a href="https://charmoptical.ca/pages/ray-ban">Ray-Ban</a>, <a href="https://charmoptical.ca/pages/oakley">Oakley</a>, <a href="https://charmoptical.ca/pages/versace">Versace</a>, Tom Ford, Burberry, Prada, and Dolce & Gabbana. Their opticians help you narrow down the options based on your face shape, prescription requirements (especially important for progressives), and personal style preferences. With <a href="https://charmoptical.ca/pages/same-day-glasses">same-day service</a> for many prescriptions, you can walk in and walk out with new glasses the same day.</p>`;
  }
  // Default expansion — general educational depth
  else {
    extra = `
        <p>This is one of the most common questions that comes up during eye exams, and the answer often depends on individual factors that only a professional assessment can evaluate. What works for one person may not be ideal for another — your prescription, daily activities, facial anatomy, and budget all play a role in determining the best approach.</p>

        <p>If you're in the Edmonton area, <a href="https://charmoptical.ca">Charm Optical</a> offers <a href="https://charmoptical.ca/pages/eye-exam-edmonton">comprehensive eye exams</a> that go beyond just measuring your prescription. Their optometrists assess your overall eye health, discuss your visual needs, and recommend lens and frame options tailored to your lifestyle. With <a href="https://charmoptical.ca/pages/providers">direct insurance billing</a> for most Alberta providers and <a href="https://charmoptical.ca/pages/same-day-glasses">same-day glasses</a> for many prescriptions, getting the right eyewear doesn't have to be complicated or expensive. <a href="https://see.charmoptical.ca">Book online</a> — appointments are usually available within a few days.</p>`;
  }

  section.content += extra;
  return section;
}

// Main
const dir = process.argv[2] || './content';
if (!fs.existsSync(dir)) { console.log('Dir not found'); process.exit(1); }

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let expanded = 0, totalBefore = 0, totalAfter = 0;

files.forEach(f => {
  const fpath = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));

  const wordsBefore = countWords(data.sections.map(s => s.content).join(' '));
  totalBefore += wordsBefore;

  // Expand each thin section
  data.sections = data.sections.map(s => expandSection(s, data));

  const wordsAfter = countWords(data.sections.map(s => s.content).join(' '));
  totalAfter += wordsAfter;

  if (wordsAfter > wordsBefore) expanded++;

  fs.writeFileSync(fpath, JSON.stringify(data, null, 2), 'utf8');
});

console.log(`Expanded ${expanded}/${files.length} articles`);
console.log(`Before: ${totalBefore.toLocaleString()} words avg ${Math.round(totalBefore/files.length)}/article`);
console.log(`After:  ${totalAfter.toLocaleString()} words avg ${Math.round(totalAfter/files.length)}/article`);

// Run quality check
const { execSync } = require('child_process');
const report = execSync('node expand-articles.js --check ' + dir).toString();
const lines = report.split('\n');
const summary = lines.slice(lines.indexOf('=== SUMMARY ==='));
console.log('\n' + summary.join('\n'));
