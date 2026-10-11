document.addEventListener('astro:before-preparation', (event) => {
  const from = new URL(event.from).pathname;
  const to = new URL(event.to).pathname;
  const detailRoute = /^\/projects\/[^/]+\/?$/;
  document.documentElement.dataset.routeDirection =
    from === '/projects/' && detailRoute.test(to) ? 'right'
    : detailRoute.test(from) && to === '/projects/' ? 'left'
    : to === '/' && from !== '/' ? 'down' : 'up';
});

document.addEventListener('astro:before-swap', (event) => {
  event.newDocument.documentElement.dataset.routeDirection =
    document.documentElement.dataset.routeDirection || 'up';
});
