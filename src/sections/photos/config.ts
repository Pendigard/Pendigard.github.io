import type { TemplateId } from './templates';

export type PhotoCaption = { title?: string; date?: string; camera?: string; place?: string };
export type SlotChoice =
  | { kind: 'photo'; image: string; caption?: PhotoCaption }
  | { kind: 'text'; eyebrow?: string; heading?: string; body: string }
  | { kind: 'empty' };
export type SlideChoice = {
  id: string;
  template: TemplateId;
  mirrored?: boolean;
  label?: string;
  slots: Record<string, SlotChoice>;
};
export type PhotosConfig = {
  mode: 'manual' | 'automatic' | 'mixed';
  seed: number;
  // Omit for all 89 photographs; set explicit IDs to publish a smaller collection.
  include?: readonly string[];
  slides: readonly SlideChoice[];
};

// In mixed mode, unspecified slots on these slides are filled first; the unused
// photographs then form new slides. An explicit `empty` is never filled.
export const photosConfig: PhotosConfig = {
  mode: 'mixed',
  seed: 20261012,
  slides: [
    { id: 'two-portraits', template: 'portrait-pair', label: 'Two portraits', slots: {
      left: { kind: 'photo', image: '20250816-_DSF1088' },
      right: { kind: 'photo', image: '18032026-_DSF2850'},
    } },
    { id: 'diagonal', template: 'diagonal', label: 'Two places', slots: {
      upper: { kind: 'photo', image: '_DSF5381' },
      lower: { kind: 'photo', image: '_DSF5438' },
    } },
    { id: 'major', template: 'full-bleed', label: 'Evening sky', slots: {
      image: { kind: 'photo', image: 'IMG_7058' },
    } },
    { id: 'field', template: 'portrait-stack', label: 'Green fields', slots: {
      portrait: { kind: 'photo', image: '_DSF5310' },
      upper: { kind: 'photo', image: '_DSF5319' },
      lower: { kind: 'photo', image: '_DSF5321' },
    } },
    { id: 'four-views', template: 'four-up', label: 'Four views', slots: {
      upperLeft: { kind: 'photo', image: '_DSF4940' },
      upperRight: { kind: 'photo', image: '_DSF4950' },
      lowerLeft: { kind: 'photo', image: '_DSF4298' },
      lowerRight: { kind: 'photo', image: '_DSF4335' },
    } },
    { id: 'offset', template: 'offset-pair', label: 'Two offset views', mirrored: true, slots: {
      upper: { kind: 'photo', image: '_DSF5440' },
      lower: { kind: 'photo', image: '_DSF5491' },
    } },
    { id: 'wide-and-tall', template: 'landscape-portrait', mirrored: true, label: 'Wide and tall', slots: {
      landscape: { kind: 'photo', image: '_DSF5496' },
      portrait: { kind: 'photo', image: '_DSF5296' },
    } },
    { id: 'three-portraits', template: 'triptych', label: 'Three portraits', slots: {
      left: { kind: 'photo', image: '_DSF3429' },
      centre: { kind: 'photo', image: '_DSF3474' },
      right: { kind: 'photo', image: '_DSF3801' },
    } },
  ],
};
