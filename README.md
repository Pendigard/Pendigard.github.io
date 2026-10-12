# Célian's Portfolio

A static Astro portfolio featuring projects, background, profile, and photography. The site uses slide-by-slide navigation, page transitions, and text that appears in reading order.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Astro, usually `http://localhost:4321/`.

## Check and build

```sh
npm run check
npm run build
npm run preview
```

Astro writes the static site to `dist/`. The site does not require a backend or database.

## Pages and navigation

- `/` introduces the site and lets visitors select a section by scrolling or using the keyboard. A different background photograph is chosen on a full reload when possible.
- `/background/` presents Experiences and Education as vertical timelines. Events with associated projects link to a filtered Projects view. `/career/` redirects here.
- `/projects/` presents nine projects with tag filters, links, and contextual views opened from Background. Project entries and filters are defined in `src/sections/projects/content.ts`.
- `/profile/` covers research interests, technical skills, languages, and hobbies across four slides. `/me/` redirects here.
- `/photos/` presents the photography gallery using eight layout templates. Its selection and slide arrangement are configured in `src/sections/photos/`.

Sections can be opened directly by URL. Within a section, the mouse wheel, touch gestures, and arrow keys move between slides. Links provide navigation between routes, while Astro's `ClientRouter` handles page transitions. Reduced-motion preferences are supported.

## Project structure

- `src/pages/` defines the routes.
- `src/sections/` contains section content, templates, and settings.
- `src/config/` holds shared interaction and animation settings.
- `src/scripts/` handles navigation, gestures, transitions, and text animation.
- `src/styles/` contains shared and section styles.
- `src/assets/images/` contains the images selected for the site and optimized by Astro.
- `public/` contains the favicon and Apple touch icon.

The local `img/` directory holds original photographs, and `refs/` holds design references. Neither directory is published with the site.

## Deploy to GitHub Pages

The site is configured for the root address `https://pendigard.github.io/`. Publish it from a public repository named `Pendigard.github.io`, then select **GitHub Actions** as the source in the repository's **Settings → Pages**. The workflow in `.github/workflows/deploy.yml` builds and deploys the site on pushes to `master`; it can also be run manually from the Actions tab.
