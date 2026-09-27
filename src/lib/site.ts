// Site-wide details shown in the header strip and footer. Edit here, not in the layout.
export const PODCAST = {
  name: 'Intelligence Snacks',
  tagline: 'Ideas for the age of AI',
  pitch: 'Weekly conversations about AI, software and business, from the team behind Normie Mode.',
  url: 'https://intelligencesnacks.com/',
  links: [
    { label: 'Spotify', url: 'https://open.spotify.com/show/5mhoDNtKg1A0j0IZIw0fIv' },
    { label: 'YouTube', url: 'https://www.youtube.com/@IntelligenceSnacks' },
    { label: 'Newsletter', url: 'https://intelligencesnacks.com/' },
  ],
};

/**
 * The footer's newsletter signup posts to the Intelligence Snacks site, which adds the address to
 * Beehiiv. That site must allow requests from Normie Mode's domain (CORS); until it does, the form
 * sends people to intelligencesnacks.com to finish signing up.
 */
export const NEWSLETTER = {
  endpoint: 'https://intelligencesnacks.com/api/subscribe',
  source: 'normie-mode-footer',
  fallback: 'https://intelligencesnacks.com/',
};
