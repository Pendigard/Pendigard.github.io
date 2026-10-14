export const sectionNavigation = [
  { label: 'Projects', href: '/projects/' },
  { label: 'Background', href: '/background/' },
  { label: 'Profile', href: '/profile/' },
  { label: 'Photos', href: '/photos/' },
] as const;

export function sectionIndex(path: string) {
  return sectionNavigation.findIndex(({ href }) => path === href ||
    (href === '/projects/' && path.startsWith('/projects/')));
}
