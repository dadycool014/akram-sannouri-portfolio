/*
 * Galerie de démonstration
 * --------------------------------------------------------------------------
 * Remplacez chaque image et chaque fiche par un vrai projet avant publication.
 * Le champ `videoUrl` accepte une URL d'intégration YouTube/Vimeo ; tant qu'il
 * reste vide, la carte ouvre uniquement l'image et n'affiche aucun faux bouton
 * de lecture.
 */

const CATEGORIES = {
  histoire: "Histoires",
  portrait: "Portraits",
  musique: "Musique",
  marque: "Marques",
  evenement: "Événements",
};

const PROJECTS = [
  {
    slug: "ceremonie-privee",
    title: "Cérémonie privée",
    category: "histoire",
    format: "Photographie",
    detail: "Direction visuelle",
    image: "assets/media/hero-wedding.webp",
    alt: "Couple marchant dans une cour méditerranéenne à la lumière dorée",
    ratio: "wide",
    demo: true,
    videoUrl: "",
  },
  {
    slug: "ligne-claire",
    title: "Ligne claire",
    category: "portrait",
    format: "Photographie",
    detail: "Éditorial",
    image: "assets/media/editorial-portrait.webp",
    alt: "Portrait éditorial dans une ruelle blanche méditerranéenne",
    ratio: "tall",
    demo: true,
    videoUrl: "",
  },
  {
    slug: "live-session",
    title: "Live Session",
    category: "musique",
    format: "Photogramme du film",
    detail: "Direction lumière",
    image: "assets/media/music-film.webp",
    alt: "Musicien interprétant un morceau dans un studio sombre et ambré",
    ratio: "wide",
    demo: true,
    videoUrl: "",
  },
  {
    slug: "objet-matiere",
    title: "Objet & matière",
    category: "marque",
    format: "Photographie",
    detail: "Nature morte",
    image: "assets/media/brand-still.webp",
    alt: "Flacon en verre ambré posé sur du travertin et du lin",
    ratio: "square",
    demo: true,
    videoUrl: "",
  },
  {
    slug: "apres-minuit",
    title: "Après minuit",
    category: "evenement",
    format: "Photographie",
    detail: "Reportage",
    image: "assets/media/event-night.webp",
    alt: "Invités dansant dans une cour éclairée par des guirlandes",
    ratio: "tall",
    demo: true,
    videoUrl: "",
  },
];
