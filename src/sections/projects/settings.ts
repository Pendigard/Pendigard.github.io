import { sectionSettings } from '../../config/sections';

// Shared values are defaults. Add a key here only when Projects needs to differ.
// A local override wins over the same key in sectionSettings; lineDrawMs controls project rules.
const projectOverrides: Partial<typeof sectionSettings> = {
  lineDrawMs: 425,
};

export const projectSettings = {
  ...sectionSettings,
  ...projectOverrides,
  writing: {
    eyebrowMs: projectOverrides.headingCharacterMs ?? sectionSettings.headingCharacterMs,
    titleMs: projectOverrides.headingCharacterMs ?? sectionSettings.headingCharacterMs,
    selectorMs: projectOverrides.headingCharacterMs ?? sectionSettings.headingCharacterMs,
    entryMs: projectOverrides.characterMs ?? sectionSettings.characterMs,
    detailMs: projectOverrides.characterMs ?? sectionSettings.characterMs,
  },
  selector: {
    stepMs: 45,
    autoScrollIntervalMs: 3000,
    autoScrollAfterUserMs: 6000,
    autoScrollStepMs: 850,
    easing: sectionSettings.slideMoveEasing,
    widthMs: 260,
    wheelThreshold: projectOverrides.wheelThreshold ?? sectionSettings.wheelThreshold,
    wheelGestureGapMs: projectOverrides.wheelGestureGapMs ?? sectionSettings.wheelGestureGapMs,
    wheelLockMinMs: projectOverrides.wheelLockMinMs ?? sectionSettings.wheelLockMinMs,
    demoDelayMs: 280,
    demoPauseMs: 110,
    demoSteps: 2,
    touchThresholdPx: 25,
  },
  gesture: {
    touchSlideThresholdPx: 45,
    touchHorizontalReturnThresholdPx: 55,
  },
  resizeDebounceMs: 140,
  introFallbackMs: 7000,
  layout: {
    maxSlideFill: .87,
    listTopDesktop: '30%',
    listTopMobile: '27%',
    headingListGapPx: { desktop: 48, mobile: 12 },
    listBottom: '13%',
    listWidth: '64rem',
    entryTitleMaxWidth: '48ch',
    entryDescriptionMaxWidth: '76ch',
    entryBottomSpacing: 'clamp(1rem, 2.8vh, 1.65rem)',
    entryBottomSpacingMobile: '.8rem',
    ruleBottomSpacing: 'clamp(.7rem, 1.4vh, 1rem)',
    ruleBottomSpacingMobile: '.55rem',
  },
  fontSize: {
    eyebrow: 'clamp(.85rem, 1.05vw, 1rem)',
    heading: 'clamp(3.2rem, 7vw, 6.4rem)',
    headingMobile: 'clamp(2.8rem, 11vw, 4.4rem)',
    selector: 'clamp(1rem, 1.3vw, 1.35rem)',
    selectorMobile: 'clamp(.98rem, 4vw, 1.13rem)',
    entryTitle: 'clamp(1.55rem, 2.55vw, 2.55rem)',
    entryTitleMobile: 'clamp(1.3rem, 5.2vw, 1.7rem)',
    entryLink: 'clamp(.88rem, 1.12vw, 1.1rem)',
    entryLinkMobile: '.86rem',
    entryDescription: 'clamp(.98rem, 1.18vw, 1.16rem)',
    entryDescriptionMobile: 'clamp(.88rem, 3.7vw, 1rem)',
    entryMetadata: 'clamp(.8rem, 1vw, .98rem)',
    entryMetadataMobile: '.78rem',
    detailBody: 'clamp(1.15rem, 1.7vw, 1.65rem)',
    detailBodyMobile: 'clamp(1.05rem, 4.2vw, 1.32rem)',
  },
} as const;

export const projectFontVariables = Object.entries(projectSettings.fontSize)
  .map(([key, value]) => `--projects-font-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value};`)
  .join('');

export const projectLayoutVariables = Object.entries(projectSettings.layout)
  .filter(([, value]) => typeof value === 'string')
  .map(([key, value]) => `--projects-layout-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value};`)
  .join('');
