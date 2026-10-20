/** Read-only inventory of published spot HTML. Word counts are triage, not AdSense criteria.
 * Usage: node scripts/content-audit.mjs [build-directory] > docs/adsense/spot-inventory.csv
 */
import fs from 'node:fs';
import path from 'node:path';
const build = path.resolve(process.argv[2] || 'dist');
const guides = JSON.parse(fs.readFileSync(new URL('../src/data/spot-guides.json', import.meta.url), 'utf8'));
const spotDir = path.join(build, 'spot');
const text = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&(?:[a-z]+|#\d+);/gi, ' ').replace(/\s+/g, ' ').trim();
const rows = fs.readdirSync(spotDir).flatMap(slug => {
  const file = path.join(spotDir, slug, 'index.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0];
  if (!article) throw new Error(`Missing article body: ${slug}`);
  const guide = guides[slug];
  const wordCount = text(article).split(/\s+/).length;
  // Nearby listings add repeated copy, so also expose core content length.
  const core = article.split(/<h2>Nearby fishing spots<\/h2>/i)[0];
  return [{ slug, wordCount, coreWords: text(core).split(/\s+/).length, guide }];
}).sort((a, b) => Number(!!a.guide) - Number(!!b.guide) || a.coreWords - b.coreWords || a.slug.localeCompare(b.slug));
console.log('slug,rendered_words,core_words,researched_sections,source_check_date,next_action');
for (const row of rows) {
  console.log([row.slug, row.wordCount, row.coreWords, row.guide?.sections?.length || 0, row.guide?.sourcesCheckedOn || '', row.guide ? 'Review source freshness and reader usefulness' : 'Research access decisions and location-specific constraints'].join(','));
}
console.error(`Audited ${rows.length} published spot files; ${rows.filter(r => !r.guide).length} lack researched sections in current source. Counts include headings and lists; no approval threshold is implied.`);
