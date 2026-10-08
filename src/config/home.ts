export const sections = [
  { label: 'My Projects.', href: '/projects/' },
  { label: 'My Career.', href: '/career/' },
  { label: 'Me.', href: '/me/' },
  { label: 'My Photos.', href: '/photos/' },
] as const;

export const homeSettings = {
  defaultSection: 0,
  titleCharacterMs: 64,
  sentenceCharacterMs: 45,
  sectionCharacterMs: 56,
  betweenLinesMs: 210,
  beforeDemonstrationMs: 220,
  demonstrationStepMs: 205,
  selectionStepMs: 320,
  wheelGestureGapMs: 45,
  backgroundBlurPx: 13,
  grainOpacity: 0.19,
} as const;
