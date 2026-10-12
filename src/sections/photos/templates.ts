export type TemplateId =
  | 'full-bleed' | 'portrait-pair' | 'diagonal' | 'portrait-stack'
  | 'four-up' | 'offset-pair' | 'landscape-portrait' | 'triptych';
export type Orientation = 'landscape' | 'portrait' | 'square';
export type CaptionPosition = 'above' | 'below' | 'overlay';
export type TemplateSlot = {
  orientation: 'landscape' | 'portrait' | 'any';
  caption: CaptionPosition;
  text: boolean;
};
export type PhotoTemplate = { slots: Record<string, TemplateSlot> };

// Slot order is also the visual reading order used by the typewriter.
export const photoTemplates: Record<TemplateId, PhotoTemplate> = {
  'full-bleed': { slots: { image: { orientation: 'any', caption: 'overlay', text: false } } },
  'portrait-pair': { slots: {
    left: { orientation: 'portrait', caption: 'below', text: true },
    right: { orientation: 'portrait', caption: 'above', text: true },
  } },
  diagonal: { slots: {
    upper: { orientation: 'landscape', caption: 'below', text: true },
    lower: { orientation: 'landscape', caption: 'above', text: true },
  } },
  'portrait-stack': { slots: {
    portrait: { orientation: 'portrait', caption: 'below', text: true },
    upper: { orientation: 'landscape', caption: 'above', text: true },
    lower: { orientation: 'landscape', caption: 'below', text: true },
  } },
  'four-up': { slots: {
    upperLeft: { orientation: 'landscape', caption: 'above', text: true },
    upperRight: { orientation: 'landscape', caption: 'above', text: true },
    lowerLeft: { orientation: 'landscape', caption: 'below', text: true },
    lowerRight: { orientation: 'landscape', caption: 'below', text: true },
  } },
  'offset-pair': { slots: {
    upper: { orientation: 'landscape', caption: 'below', text: true },
    lower: { orientation: 'landscape', caption: 'above', text: true },
  } },
  'landscape-portrait': { slots: {
    landscape: { orientation: 'landscape', caption: 'above', text: true },
    portrait: { orientation: 'portrait', caption: 'below', text: true },
  } },
  triptych: { slots: {
    left: { orientation: 'portrait', caption: 'below', text: true },
    centre: { orientation: 'portrait', caption: 'above', text: true },
    right: { orientation: 'portrait', caption: 'below', text: true },
  } },
};
