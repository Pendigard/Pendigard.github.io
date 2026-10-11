export const sections = [
  { label: 'Background.', href: '/background/' },
  { label: 'Projects.', href: '/projects/' },
  { label: 'Profile.', href: '/profile/' },
  { label: 'Photos.', href: '/photos/' },
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
  autoScrollIntervalMs: 2000,
  autoScrollAfterUserMs: 2500,
  autoScrollStepMs: 900,
  wheelGestureGapMs: 45,
  wheelGestureThreshold: 12,
  wheelCooldownMs: 90,
  wheelReleaseGapMs: 90,
  backgroundBlurPx: 13,
  grainOpacity: 0.19,
} as const;
