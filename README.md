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
- `src/sections/background/` : contenu provisoire, réglages et composition des frises Experiences et Education.
- `src/sections/projects/` : neuf projets, tags filtrables, destinations et réglages propres à Projects.
- Les sous-titres Experiences et Education restent en place pendant les slides de leur frise et accompagnent la transition vers la frise suivante.
- `src/scripts/` : navigation, séquence d'ouverture et transitions.
- `src/styles/` : styles partagés et styles de l'accueil.
- `src/assets/images/home/` : photos retenues et optimisées par Astro.
- `img/homepage/` : banque de photographies d'origine.
- `refs/` : références visuelles et maquettes, à consulter selon `AGENTS.md`.

L'accueil propose l'écriture progressive, une démonstration de la sélection, puis la navigation à la molette, au pavé tactile, au clavier et par liens. Un rechargement complet choisit une autre photo que celle du chargement précédent, lorsque c'est possible. Un clic abrège la séquence en cours tout en laissant agir les liens.

`/background/` présente deux frises sur des slides parcourues vers le bas pour avancer et vers le haut pour revenir, à la molette ou aux flèches du clavier. Une colonne de rectangles indique la slide active. Le contenu de `src/sections/background/content.ts` est explicitement provisoire : remplacer les entrées par des informations biographiques vérifiées, dans l'ordre antéchronologique. `src/sections/background/settings.ts` règle le nombre d'événements par slide et les tailles de texte ; les rythmes d'animation et seuils de défilement viennent de `src/config/sections.ts`. Le lien de retour s'écrit après la première slide à chaque ouverture de section. L'ancienne URL `/career/` redirige vers `/background/`.

`/projects/` répartit les neuf projets selon leur hauteur mesurée et propose cinq tags de `src/sections/projects/content.ts` comme filtres. Chaque fiche garde son contexte, ses compétences, ses technologies et sa destination dans ce fichier. Les projets sans lien vers l'ensemble du travail ouvrent une sous-section interne à droite ; les autres ouvrent la ressource indiquée sur leur fiche. Les descriptions reposent sur la liste fournie par Célian ; les dépôts, le site et la prépublication liés ont été contrôlés, mais les contributions et résultats déclarés n'ont pas tous été vérifiés indépendamment. `src/config/sections.ts` contient les valeurs communes de vitesse d'écriture, de tracé, de transition et de geste. Dans `src/sections/projects/settings.ts`, `projectOverrides` remplace ponctuellement ces valeurs ; les autres réglages Projects concernent l'écriture de ses zones, le sélecteur, les gestes tactiles, la mise en page et les tailles de texte. La priorité est **valeur locale explicite, puis valeur commune**. Les valeurs de mise en page et de typographie sont transmises aux styles par des variables CSS `--projects-layout-*` et `--projects-font-*`. Les utilitaires partagés pour la molette, le déplacement vertical et l'indicateur se trouvent dans `src/scripts/section-motion.ts`.

`/me/` et `/photos/` sont encore des pages d'attente ; un défilement vers le bas y ramène à l'accueil.
