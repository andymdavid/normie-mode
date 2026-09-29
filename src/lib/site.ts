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

export const NEWSLETTER = {
  endpoint: '/api/subscribe',
  source: 'normie-mode-footer',
  fallback: 'https://intelligencesnacks.com/',
};
