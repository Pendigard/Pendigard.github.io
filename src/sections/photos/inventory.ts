import type { ImageMetadata } from 'astro';
import type { Orientation } from './templates';

export type InventoryPhoto = { id: string; image: ImageMetadata; orientation: Orientation; alt: string };

// Descriptions are based on visual inspection; filenames never supply captions or context.
const descriptions: Record<string, string> = {
  '10082025-_DSF0931': 'Motorbikes parked along a rain-soaked street at night.',
  '11082025_DSF0982': 'A lit street cart reflected in wet pavement at night.',
  '17032026-_DSF2695': 'A stone archway between tall masonry buildings.',
  '17032026-_DSF2706': 'A harbor glimpsed between two dark stone walls.',
  '17032026-_DSF2719': 'A bird perched on a railing beside the sea.',
  '18032026-_DSF2751': 'A stone abbey rising beyond a long path and open fields.',
  '18032026-_DSF2850': 'A person standing in a dark stone cloister.',
  '20250813-_DSF1020-2': 'People seated beside a small street stall.',
  '20250813-_DSF1020': 'A red umbrella shading a roadside stall.',
  '20250813-_DSF1022': 'Motorbikes and cars gathered at a busy crossing.',
  '20250813-_DSF1028': 'A market stall beneath a row of hanging lights.',
  '20250816-_DSF1088': 'Two figures on a beach beneath a cloud-filled sky.',
  '20250816-_DSF1106': 'Small boats scattered across a shore beneath palm trees.',
  '20250817-_DSF1224': 'Motorbikes passing beneath trees and lanterns.',
  '20250817-_DSF1292': 'People gathered around a lit street stall.',
  '20250817-_DSF1304': 'Small glowing boats spread across dark water.',
  '20250818-_DSF1368': 'A person standing beside red pillars.',
  '20250819-_DSF1408': 'A street corner lined with scooters and outdoor tables.',
  '20250819-_DSF1459': 'Food stalls and people gathered on a street at night.',
  '20250819-_DSF1460': 'People sitting at tables beside bright shop signs.',
  '20250819-_DSF1463': 'People seated along a narrow, illuminated lane.',
  '20250819-_DSF1465': 'A busy market aisle under rows of red lanterns.',
  IMG_5920: 'A green sign glowing above a dark doorway.',
  IMG_5921: 'A quiet tree-lined street and a painted pedestrian path.',
  IMG_5924: 'Books and posters displayed behind a shop window.',
  IMG_6953: 'A narrow street framed by tall buildings and signs.',
  IMG_6975: 'A brightly lit shop at night beyond a dark car park.',
  IMG_7011: 'Colorful reflections layered over a street scene.',
  IMG_7012: 'Turquoise reflections across buildings and pedestrians.',
  IMG_7013: 'Pale layered reflections over a street of buildings.',
  IMG_7027: 'A grassy garden bordered by trees.',
  IMG_7056: 'A stone lantern in rain beneath green trees.',
  IMG_7058: 'Dark hills beneath clouds lit orange at sunset.',
  IMG_7087: 'A street of pedestrians and bright signs seen from above.',
  IMG_7090: 'Illuminated buildings and signs against the night sky.',
  _DSF3429: 'A small gate beneath a hollow in mottled rock.',
  _DSF3434: 'A motorbike passing small buildings and greenery.',
  _DSF3435: 'People waiting beside vehicles on a roadside.',
  _DSF3474: 'A pale car and a red tower beside low buildings.',
  _DSF3528: 'A train crossing a station beneath overhead cables.',
  _DSF3559: 'A small railway station and ticket machine in sunlight.',
  _DSF3765: 'Railway tracks winding between tall city buildings.',
  _DSF3801: 'People walking past a smoky stall beside a cafe.',
  _DSF3847: 'A stone monument beneath a clear sky.',
  _DSF4002: 'A long, narrow corridor leading toward a lit doorway.',
  _DSF4036: 'A blue-lit doorway against a dark wall.',
  _DSF4093: 'People walking along a narrow street at night.',
  _DSF4103: 'A lit window and bicycle in an otherwise dark facade.',
  _DSF4125: 'Pedestrians passing shopfronts along a sunlit street.',
  _DSF4200: 'A quiet road with painted markings at dusk.',
  _DSF4267: 'A stone path disappearing into a misty green forest.',
  _DSF4284: 'White paper streamers hanging above a stone stairway.',
  _DSF4298: 'Pink flowers rising above a green meadow.',
  _DSF4335: 'Cars parked beside rail lines under an overcast sky.',
  _DSF4337: 'A white sports car parked among other cars.',
  _DSF4384: 'Pink flowers blooming above a broad pond.',
  _DSF4388: 'Lotus flowers and large green leaves beside buildings.',
  _DSF4440: 'A mountain silhouette above dark trees at dusk.',
  _DSF4450: 'A white corner building beneath crossing utility wires.',
  _DSF4547: 'A brightly colored festival float against the night.',
  _DSF4548: 'Painted figures and faces on a glowing festival float.',
  _DSF4555: 'Colorful painted figures on a dark festival float.',
  _DSF4560: 'An illuminated festival float against a black sky.',
  _DSF4585: 'Low sunlight reflected across a river and city roofs.',
  _DSF4617: 'A lit corner shop on a dark street.',
  _DSF4686: 'Illuminated signs along a crowded night street.',
  _DSF4739: 'A rocky path beneath trees and a stone overhang.',
  _DSF4770: 'A misty stream running between dark buildings and trees.',
  _DSF4794: 'A straight wet path leading toward a wooded entrance.',
  _DSF4815: 'Fireworks above striped stalls at night.',
  _DSF4920: 'A station staircase seen through leaves.',
  _DSF4940: 'Cars on a coastal road with the sea behind them.',
  _DSF4950: 'A railway crossing beside the sea beneath blue sky.',
  _DSF4974: 'Light trails on a dark road beneath city lights.',
  _DSF5097: 'An empty street between wooden buildings.',
  _DSF5165: 'A lightning bolt beneath a dark evening sky.',
  _DSF5195: 'A fork of lightning over a dark horizon.',
  _DSF5296: 'A green field and a few houses under blue sky.',
  _DSF5310: 'A green field stretching toward distant hazy mountains.',
  _DSF5319: 'Rice plants in front of a pale mountain range.',
  _DSF5321: 'Tall green grasses against distant blue hills.',
  _DSF5380: 'A wet street lined with dark wooden buildings.',
  _DSF5381: 'A rain-soaked street receding between wooden buildings.',
  _DSF5438: 'A person on a train platform beneath roof beams.',
  _DSF5440: 'People waiting beside a stopped train.',
  _DSF5491: 'Shoppers beneath signs in a covered market.',
  _DSF5496: 'A low industrial structure beside a grey shoreline.',
  _DSF5538: 'A road climbing toward a clear blue sky.',
};

const sources = import.meta.glob<{ default: ImageMetadata }>('../../assets/images/photos/gallery/*.jpg', { eager: true });
export const photoInventory: readonly InventoryPhoto[] = Object.entries(sources).map(([path, source]) => {
  const id = path.split('/').at(-1)!.replace(/\.jpg$/, '');
  const image = source.default;
  if (!descriptions[id]) throw new Error(`Photos: missing inspected alt text for ${id}`);
  const orientation: Orientation = image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square';
  return { id, image, alt: descriptions[id], orientation };
}).sort((a, b) => a.id.localeCompare(b.id));

const missing = Object.keys(descriptions).filter((id) => !photoInventory.some((photo) => photo.id === id));
if (missing.length) throw new Error(`Photos: missing image assets: ${missing.join(', ')}`);
export const photoById = new Map(photoInventory.map((photo) => [photo.id, photo]));
