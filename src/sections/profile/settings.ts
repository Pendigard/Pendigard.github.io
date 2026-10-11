import { sectionSettings } from '../../config/sections';

export const profileSettings = {
  characterMs: sectionSettings.characterMs,
  headingCharacterMs: sectionSettings.headingCharacterMs,
  betweenFieldsMs: sectionSettings.betweenFieldsMs,
  languagePhraseCharacterMs: 22,
  translationCharacterMs: 28,
  portraitEnterMs: 900,
  introFallbackMs: 7000,
} as const;
