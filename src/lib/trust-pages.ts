export interface TrustPage {
  slug: 'about' | 'contact' | 'editorial-policy' | 'corrections';
  title: string;
  description: string;
}

export const TRUST_PAGES: TrustPage[] = [
  {
    slug: 'about',
    title: 'About Normie Mode',
    description: 'Who produces Normie Mode, what it is for, and who reviews its comparisons.',
  },
  {
    slug: 'contact',
    title: 'Contact Normie Mode',
    description: 'Contact Normie Mode with a question, comment or correction.',
  },
  {
    slug: 'editorial-policy',
    title: 'Editorial policy',
    description: 'How Normie Mode sources evidence, compares exact model versions and reviews recommendations.',
  },
  {
    slug: 'corrections',
    title: 'Corrections policy',
    description: 'How to report an error and how Normie Mode records material corrections.',
  },
];

export function visibleTrustPages(_preview: boolean) {
  return TRUST_PAGES;
}
