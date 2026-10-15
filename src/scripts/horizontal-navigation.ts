import { projectContexts } from '../sections/background/content';
import { navigate } from 'astro:transitions/client';
import { restoreSectionOnNextNavigation } from './section-navigation';

export interface BackgroundPosition { slide: number; revealed: number[]; headings: string[] }
export interface ProjectsPosition { filter: string; slide: number; revealedProjects: string[]; context: string | null }

let backgroundPosition: BackgroundPosition | undefined;
const projectsPositions = new Map<string, ProjectsPosition>();
const revealedProjects = new Set<string>();
const detailPositions = new Map<string, { slide: number; revealed: number[] }>();

export function saveBackgroundPosition(position: BackgroundPosition) { backgroundPosition = position; }
export function getBackgroundPosition() { return backgroundPosition; }
const projectViewKey = (context: string | null) => context === null ? 'all' : `context:${context}`;
export function saveProjectsPosition(position: ProjectsPosition) {
  projectsPositions.set(projectViewKey(position.context), position);
  position.revealedProjects.forEach((id) => revealedProjects.add(id));
}
export function getProjectsPosition(context: string | null) {
  return projectsPositions.get(projectViewKey(context));
}
export function getRevealedProjects() { return new Set(revealedProjects); }
export function hasVisitedProjects() { return projectsPositions.size > 0; }
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
  return '/projects/';
}

export function returnToPrevious() {
  const destination = previousSectionUrl();
  restoreSectionOnNextNavigation(destination);
  const parent = history.state?.portfolioParent as string | undefined;
  if (parent && new URL(parent, location.href).pathname === new URL(destination, location.href).pathname &&
    new URL(parent, location.href).search === new URL(destination, location.href).search) {
    history.back();
    return true;
  }
  void navigate(destination);
  return false;
}

export function clearHorizontalPositions() {
  backgroundPosition = undefined;
  projectsPositions.clear();
  revealedProjects.clear();
  detailPositions.clear();
}

export function routeDepth(url: URL) {
  if (/^\/projects\/[^/]+\/?$/.test(url.pathname)) return contextFromUrl(url) ? 3 : 2;
  if (url.pathname === '/projects/') return contextFromUrl(url) ? 2 : 1;
  if (url.pathname === '/background/') return 1;
  return 0;
}
