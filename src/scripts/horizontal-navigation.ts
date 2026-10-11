import { projectContexts } from '../sections/background/content';
import { navigate } from 'astro:transitions/client';

export interface BackgroundPosition { slide: number; revealed: number[]; headings: string[] }
export interface ProjectsPosition { filter: string; slide: number; revealedProjects: string[]; context: string | null }

let backgroundPosition: BackgroundPosition | undefined;
let projectsPosition: ProjectsPosition | undefined;
const detailPositions = new Map<string, { slide: number; revealed: number[] }>();

export function saveBackgroundPosition(position: BackgroundPosition) { backgroundPosition = position; }
export function getBackgroundPosition() { return backgroundPosition; }
export function saveProjectsPosition(position: ProjectsPosition) { projectsPosition = position; }
export function getProjectsPosition(context: string | null) {
  return projectsPosition?.context === context ? projectsPosition : undefined;
}
export function saveDetailPosition(key: string, position: { slide: number; revealed: number[] }) { detailPositions.set(key, position); }
export function getDetailPosition(key: string) { return detailPositions.get(key); }

export function contextFromUrl(url: URL = new URL(location.href)) {
  const id = url.searchParams.get('from');
  return projectContexts.find((context) => context.id === id);
}

export function projectsUrl(context: string | null) {
  return context ? `/projects/?from=${encodeURIComponent(context)}` : '/projects/';
}

export function previousSectionUrl(url: URL = new URL(location.href)) {
  if (/^\/projects\/[^/]+\/?$/.test(url.pathname)) return projectsUrl(contextFromUrl(url)?.id ?? null);
  if (url.pathname === '/projects/' && contextFromUrl(url)) return `/background/#${contextFromUrl(url)!.id}`;
  return '/projects/';
}

export function horizontalPosition(url: URL = new URL(location.href)) {
  const detail = /^\/projects\/[^/]+\/?$/.test(url.pathname);
  const contextual = !!contextFromUrl(url);
  return { count: contextual ? (detail ? 3 : 2) : (detail ? 2 : 1), active: contextual ? (detail ? 2 : 1) : (detail ? 1 : 0) };
}

export function updatePreviousLink(link: HTMLAnchorElement) {
  link.href = previousSectionUrl();
  link.textContent = 'Back to the previous section.';
}

export function returnToPrevious(link: HTMLAnchorElement) {
  const parent = history.state?.portfolioParent as string | undefined;
  if (parent && new URL(parent, location.href).pathname === new URL(link.href).pathname &&
    new URL(parent, location.href).search === new URL(link.href).search) {
    history.back();
    return true;
  }
  void navigate(link.href);
  return false;
}

export function clearHorizontalPositions() {
  backgroundPosition = undefined;
  projectsPosition = undefined;
  detailPositions.clear();
}

export function routeDepth(url: URL) {
  if (/^\/projects\/[^/]+\/?$/.test(url.pathname)) return contextFromUrl(url) ? 3 : 2;
  if (url.pathname === '/projects/') return contextFromUrl(url) ? 2 : 1;
  if (url.pathname === '/background/') return 1;
  return 0;
}
