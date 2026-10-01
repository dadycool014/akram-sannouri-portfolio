# Portfolio — Akram Sannouri

Site statique de photographe et vidéaste, composé d’une page d’accueil et d’un portfolio filtrable.

## Personnalisation avant publication

1. Remplacer les cinq visuels de démonstration dans `assets/media/` par les travaux originaux d’Akram.
2. Mettre à jour les projets, catégories, textes alternatifs et éventuelles vidéos dans `assets/projects.js`.
3. Vérifier l’adresse `contact@akramsannouri.com` dans les deux pages HTML et dans l’attribut `data-email` du formulaire.
4. Remplacer les liens Instagram et YouTube génériques dans les pieds de page.
5. Supprimer les badges et la note « Visuel démo » après avoir intégré les vrais médias (`demo: false` dans `assets/projects.js` et badges correspondants dans `index.html`).

Les visuels actuels ont été générés spécialement pour cette maquette. Ils servent uniquement à présenter la direction artistique et ne doivent pas être publiés comme des réalisations réelles.

## Ajouter une vidéo

Dans `assets/projects.js`, renseigner `videoUrl` avec une URL d’intégration autorisée (par exemple une URL `youtube-nocookie.com/embed/...`). Le bouton de lecture n’apparaît que lorsqu’une vraie vidéo est fournie.

## Prévisualisation

Le projet ne nécessite aucune compilation. Lancer `node .claude/serve.js`, ouvrir `http://127.0.0.1:5500`, puis consulter `realisations.html` pour tester les filtres et la lightbox.
