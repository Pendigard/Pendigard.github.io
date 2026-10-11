export interface ProjectOrigin {
  slug: string;
  filter: string;
  slide: number;
  revealedProjects: string[];
}

let origin: ProjectOrigin | undefined;
let returnPending = false;
export function saveProjectOrigin(value: ProjectOrigin) { origin = value; returnPending = false; }
export function getProjectOrigin() { return returnPending ? origin : undefined; }
export function clearProjectOrigin() { origin = undefined; returnPending = false; }

document.addEventListener('astro:before-preparation', (event) => {
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  if (to === '/' || (to === '/projects/' && !/^\/projects\/[^/]+\/?$/.test(from))) {
    clearProjectOrigin();
  } else if (to === '/projects/' && /^\/projects\/[^/]+\/?$/.test(from)) {
    returnPending = true;
  }
});
