# Site Call 19 Production

Le nouveau site d'Akram (dossier `public/`), servi par un petit serveur Node.js (Express + Nodemailer) qui envoie chaque demande du formulaire de devis par email à call19production@gmail.com.

## Lancer en local

```
cd site-call19
npm install
npm start
```

Ouvrir ensuite http://localhost:3019.

Sans réglage SMTP, le serveur tourne en mode test : chaque demande s'affiche dans la console au lieu d'être envoyée.

## Configurer l'envoi des emails

1. Copier `.env.example` en `.env`.
2. Avec Gmail : activer la validation en deux étapes sur le compte call19production@gmail.com, puis créer un « mot de passe d'application » sur myaccount.google.com/apppasswords. Le coller dans `SMTP_PASS`.
   Un autre fournisseur marche aussi (la messagerie de l'hébergeur, Brevo…) : changer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` et `SMTP_PASS`.
3. Relancer `npm start`. La console doit afficher « SMTP prêt ».

Le fichier `.env` contient le mot de passe : il ne doit jamais être publié (il est exclu par `.gitignore`).

## Mettre en ligne

Il faut un hébergement qui exécute Node.js 20 ou plus (GitHub Pages et les artifacts claude.ai ne le font pas) :

- dossier de l'application : `site-call19`
- installation : `npm install`
- démarrage : `npm start`
- variables d'environnement : celles de `.env.example`, plus `NODE_ENV=production`

En production, si le SMTP n'est pas réglé, le formulaire répond par une erreur et propose au visiteur d'envoyer le message lui-même. Il ne fait jamais croire qu'une demande est partie.

Si le site est servi par un autre hébergement que le serveur, mettre l'adresse complète de l'API dans l'attribut `data-endpoint` du formulaire (`public/index.html`) et l'adresse du site dans `ALLOWED_ORIGINS`.

## Ce que fait le serveur

- `POST /api/contact` reçoit le nom, l'email, le service, la date et le projet, puis envoie un email en texte brut. Le bouton « Répondre » de la messagerie écrit directement au client.
- Les champs sont vérifiés et tronqués côté serveur. Le service doit faire partie de la liste du formulaire.
- Un champ invisible piège les robots, et une même adresse IP ne peut pas envoyer plus de 5 demandes en 15 minutes.
- Aucune demande n'est enregistrée sur le serveur.
