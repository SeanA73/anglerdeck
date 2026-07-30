/**
 * Single source of truth for the countries AnglerDeck covers.
 *
 * Hub pages live at /fishing/<slug> — readable slugs rather than ISO codes,
 * because "/fishing/new-zealand" is a better URL for both users and search
 * than "/fishing/nz".
 *
 * Shared with scripts/prerender.mjs via scripts/countries.mjs — keep the two
 * in step.
 */

export interface Country {
  code: string;
  name: string;
  slug: string;
  /** One-line framing for the hub page intro. */
  blurb: string;
}

export const COUNTRIES: Country[] = [
  { code: "AU", name: "Australia", slug: "australia", blurb: "Licences are issued state by state, and the rules change as you cross borders. Northern Territory and South Australia require no general recreational licence at all, while Victoria, NSW and Tasmania do." },
  { code: "US", name: "United States", slug: "united-states", blurb: "Every state runs its own licence system, and saltwater usually needs either a separate licence or enrolment in a free marine registry. Check the state, not the country." },
  { code: "CA", name: "Canada", slug: "canada", blurb: "Freshwater licences are provincial, but tidal water in British Columbia needs a federal DFO licence plus a Salmon Conservation Stamp to keep salmon." },
  { code: "NZ", name: "New Zealand", slug: "new-zealand", blurb: "Sea fishing needs no licence. Freshwater does — a Fish & Game licence almost everywhere, except the Taupō district, which DOC administers separately." },
  { code: "GB", name: "United Kingdom", slug: "united-kingdom", blurb: "England and Wales require an Environment Agency rod licence. Scotland issues none, but you need the beat owner's permission instead. Sea angling is free throughout." },
  { code: "DE", name: "Germany", slug: "germany", blurb: "A Fischereischein usually requires passing a state exam, which makes casual visiting difficult — except in Mecklenburg-Vorpommern, which sells an exam-free tourist licence." },
  { code: "FR", name: "France", slug: "france", blurb: "Freshwater needs a carte de pêche through a local AAPPMA association. Sea fishing from shore or boat requires no licence at all." },
  { code: "ES", name: "Spain", slug: "spain", blurb: "Licences are issued by each autonomous community, and inland ones often require an exam in Spanish. Sea anglers must also report catches through the PescaREC app." },
  { code: "IT", name: "Italy", slug: "italy", blurb: "Freshwater licences are regional. Sea fishing is free but requires registration with the MASAF ministry and daily catch reporting via the RecFishing app." },
  { code: "NO", name: "Norway", slug: "norway", blurb: "Sea fishing is completely free and unlicensed. Freshwater needs a local fiskekort, and salmon rivers also require the national fishing fee." },
  { code: "SE", name: "Sweden", slug: "sweden", blurb: "Rod fishing in the sea is free, as is fishing on the five great lakes. Everywhere else needs a local permit." },
  { code: "FI", name: "Finland", slug: "finland", blurb: "Everyman's right covers ice fishing and simple float fishing for free. Lure fishing needs the state fisheries management fee, and often a local permit too." },
  { code: "ZA", name: "South Africa", slug: "south-africa", blurb: "Marine anglers need a DFFE recreational permit, now available online. Freshwater licences are provincial." },
  { code: "AR", name: "Argentina", slug: "argentina", blurb: "Licences are provincial, and Patagonian trout seasons run roughly November to April. Several of the best fisheries are accessible only through lodges." },
  { code: "BR", name: "Brazil", slug: "brazil", blurb: "One federal licença de pesca amadora covers the whole country for a year. The piracema spawning closure restricts fishing over the southern summer." },
  { code: "MX", name: "Mexico", slug: "mexico", blurb: "A CONAPESCA licence is required for every person aboard a fishing vessel, whether they fish or not. Shore fishing needs no licence." },
  { code: "JP", name: "Japan", slug: "japan", blurb: "Rivers and lakes are managed by cooperatives that issue day permits called yugyoken. Sea fishing needs no licence, though foreign nationals face vessel-size rules." },
  { code: "RU", name: "Russia", slug: "russia", blurb: "There is no general recreational licence, but the famous salmon and taimen rivers are permit-only through licensed camps, and some sit in border zones." },
  { code: "PL", name: "Poland", slug: "poland", blurb: "Polish nationals need an exam-based fishing card; visitors are explicitly exempt. Everyone needs a permit for the specific water." },
];

export const countryBySlug = (slug: string): Country | undefined =>
  COUNTRIES.find((c) => c.slug === slug);

export const countryByCode = (code: string): Country | undefined =>
  COUNTRIES.find((c) => c.code === code);
