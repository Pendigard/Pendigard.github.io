# Portfolio de Célian

Base Astro pour construire progressivement le portfolio décrit dans [AGENTS.md](AGENTS.md).

## Démarrer

Prérequis : Node.js 22.12 ou plus récent, et npm.

```sh
npm install
npm run dev
```

Ouvrir ensuite l'adresse locale indiquée dans le terminal, généralement `http://localhost:4321/`.

## Vérifier et construire

```sh
npm run check
npm run build
npm run preview
```

Astro génère le site statique dans `dist/`. Aucun backend ni service externe n'est nécessaire pour cette première étape.

## Organisation actuelle

- `src/pages/` : accueil et quatre routes de section.
- `src/layouts/` : structure commune, incluant le routeur de transitions d'Astro.
- `src/config/home.ts` : sections et réglages de l'accueil.
- `src/scripts/` : navigation, séquence d'ouverture et transitions.
- `src/styles/` : styles partagés et styles de l'accueil.
- `src/assets/images/home/` : photos retenues et optimisées par Astro.
- `img/homepage/` : banque de photographies d'origine.
- `refs/` : références visuelles et maquettes, à consulter selon `AGENTS.md`.

L'accueil propose l'écriture progressive, une démonstration de la sélection, puis la navigation à la molette, au pavé tactile, au clavier et par liens. Un rechargement complet choisit une autre photo que celle du chargement précédent, lorsque c'est possible. Les quatre routes de section sont actuellement des pages d'attente accessibles directement ; leurs textes s'écrivent progressivement et un défilement vers le haut ramène à l'accueil. Leurs slides et leur contenu restent à construire.
