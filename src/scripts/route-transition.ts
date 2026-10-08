document.addEventListener('astro:before-preparation', (event) => {
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  document.documentElement.dataset.routeDirection = to === '/' && from !== '/' ? 'down' : 'up';
});

document.addEventListener('astro:before-swap', (event) => {
  event.newDocument.documentElement.dataset.routeDirection =
    document.documentElement.dataset.routeDirection || 'up';
});
