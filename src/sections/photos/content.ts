import { photosConfig, type PhotoCaption, type PhotosConfig, type SlotChoice } from './config';
import { photoById, photoInventory, type InventoryPhoto } from './inventory';
import { photoTemplates, type CaptionPosition, type TemplateId, type TemplateSlot } from './templates';

export type RenderSlot =
  | { id: string; kind: 'photo'; photo: InventoryPhoto; caption?: PhotoCaption; captionPosition: CaptionPosition }
  | { id: string; kind: 'text'; eyebrow?: string; heading?: string; body: string }
  | { id: string; kind: 'empty' };
export type GallerySlide = {
  id: string;
  label: string;
  template: TemplateId;
  mirrored: boolean;
  slots: readonly RenderSlot[];
};

function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function compatible(photo: InventoryPhoto, slot: TemplateSlot) {
  return slot.orientation === 'any' || photo.orientation === 'square' || photo.orientation === slot.orientation;
}

function choosePhoto(available: InventoryPhoto[], slot: TemplateSlot, reserved: ReadonlySet<string> = new Set()) {
  const index = available.findIndex((photo) => !reserved.has(photo.id) && compatible(photo, slot));
  return index < 0 ? undefined : available.splice(index, 1)[0];
}

function renderSlot(id: string, choice: SlotChoice | undefined, spec: TemplateSlot, available: InventoryPhoto[], used: Set<string>, autoFill: boolean, reserved: ReadonlySet<string>): RenderSlot {
  if (choice?.kind === 'empty') return { id, kind: 'empty' };
  if (choice?.kind === 'text') {
    if (!spec.text) throw new Error(`Photos: text is not allowed in slot ${id}`);
    return { id, kind: 'text', eyebrow: choice.eyebrow, heading: choice.heading, body: choice.body };
  }
  if (choice?.kind === 'photo') {
    const photo = photoById.get(choice.image);
    if (!photo) throw new Error(`Photos: unknown image ${choice.image}`);
    if (used.has(photo.id)) throw new Error(`Photos: duplicate image ${photo.id}`);
    if (!compatible(photo, spec)) throw new Error(`Photos: ${photo.id} is incompatible with slot ${id}`);
    const index = available.findIndex((item) => item.id === photo.id);
    if (index < 0) throw new Error(`Photos: ${photo.id} is outside the included image set`);
    available.splice(index, 1);
    used.add(photo.id);
    return { id, kind: 'photo', photo, caption: choice.caption, captionPosition: spec.caption };
  }
  if (!autoFill) return { id, kind: 'empty' };
  const photo = choosePhoto(available, spec, reserved);
  if (!photo) return { id, kind: 'empty' };
  used.add(photo.id);
  return { id, kind: 'photo', photo, captionPosition: spec.caption };
}

function canFill(template: TemplateId, available: readonly InventoryPhoto[]) {
  const pool = [...available];
  return Object.values(photoTemplates[template].slots).every((slot) => !!choosePhoto(pool, slot));
}

export function buildGallery(config: PhotosConfig = photosConfig): readonly GallerySlide[] {
  if (!Number.isInteger(config.seed)) throw new Error('Photos: seed must be an integer');
  if (config.mode === 'automatic' && config.slides.length) throw new Error('Photos: automatic mode must not declare manual slides');
  const included = config.include ? [...config.include] : photoInventory.map((photo) => photo.id);
  if (new Set(included).size !== included.length) throw new Error('Photos: duplicate image ID in include list');
  for (const id of included) if (!photoById.has(id)) throw new Error(`Photos: unknown included image ${id}`);
  const random = randomGenerator(config.seed);
  const available = shuffle(included.map((id) => photoById.get(id)!), random);
  const used = new Set<string>();
  const slideIds = new Set<string>();
  const slides: GallerySlide[] = [];
  const reserved = new Set<string>();
  if (config.mode !== 'automatic') for (const slide of config.slides) {
    for (const choice of Object.values(slide.slots)) if (choice.kind === 'photo') {
      if (reserved.has(choice.image)) throw new Error(`Photos: duplicate manual image ${choice.image}`);
      reserved.add(choice.image);
    }
  }

  if (config.mode !== 'automatic') for (const slide of config.slides) {
    if (slideIds.has(slide.id)) throw new Error(`Photos: duplicate slide ID ${slide.id}`);
    slideIds.add(slide.id);
    const template = photoTemplates[slide.template];
    if (!template) throw new Error(`Photos: unknown template ${slide.template}`);
    for (const key of Object.keys(slide.slots)) {
      if (!template.slots[key]) throw new Error(`Photos: slot ${key} does not exist in ${slide.template}`);
    }
    const slots = Object.entries(template.slots).map(([id, spec]) =>
      renderSlot(id, slide.slots[id], spec, available, used, config.mode === 'mixed', reserved));
    slides.push({ id: slide.id, label: slide.label ?? 'Photographs', template: slide.template,
      mirrored: !!slide.mirrored, slots });
  }

  if (config.mode !== 'manual') {
    let previous = slides.at(-1)?.template;
    const usage = new Map<TemplateId, number>();
    while (available.length) {
      const candidates = (Object.keys(photoTemplates) as TemplateId[]).filter((id) => canFill(id, available));
      const ranked = candidates.map((id) => ({ id,
        score: Object.keys(photoTemplates[id].slots).length * 1.7 + random() * 2
          - (id === previous ? 4 : 0) - (usage.get(id) ?? 0) * .95
          - (id === 'full-bleed' && available.length > 3 ? 3.5 : 0),
      })).sort((a, b) => b.score - a.score);
      const templateId = ranked[0]?.id ?? 'full-bleed';
      const slots = Object.entries(photoTemplates[templateId].slots).map(([id, spec]) =>
        renderSlot(id, undefined, spec, available, used, true, reserved));
      const ordinal = slides.length + 1;
      slides.push({ id: `auto-${ordinal}`, label: `Photographs ${ordinal}`, template: templateId,
        mirrored: random() < .5, slots });
      previous = templateId;
      usage.set(templateId, (usage.get(templateId) ?? 0) + 1);
    }
    if (used.size !== included.length) throw new Error('Photos: incomplete image coverage');
  }
  return slides;
}

export const gallerySlides = buildGallery();
