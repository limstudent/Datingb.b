# Datingb.b by industryb.b

Application mobile, en local, sans base de données.

## Lancer l'application

Le chargement des propositions utilise Ajax (fetch). Il faut donc passer par un serveur local, pas par un double clic sur index.html.

- WampServer : copier le dossier `datingbb` dans `www`, puis ouvrir http://localhost/datingbb/
- Python : dans le dossier, lancer `python -m http.server 8000`, puis ouvrir http://localhost:8000
- VS Code : extension Live Server, clic droit sur index.html, "Open with Live Server"

Pour tester sur un téléphone : même Wi-Fi que l'ordinateur, puis ouvrir http://ADRESSE-IP-DU-PC:8000

## Ajouter des photos

1. Mettre les images dans le dossier `images/` (jpg, png ou webp, format portrait 4:5 conseillé).
2. Ajouter une ligne dans la liste `photos` de `data/proposals.json` :
   `{ "id": "photo5", "src": "images/mon-image.jpg", "alt": "Description" }`
3. Recharger la page.

Les 4 portraits fournis (`images/photo1.svg` à `photo4.svg`) sont des illustrations. Tu peux les remplacer par tes propres images générées : garde le même nom de fichier, ou change le chemin dans `proposals.json`.

## Boutons du bas

- Cerise rouge : Match (actif quand tous les champs obligatoires sont remplis)
- Croix blanche : efface le profil et recommence (une confirmation est demandée)

## Modifier les choix proposés

Les langues, hobbies, intentions, prompts et signes astrologiques sont dans `data/proposals.json`.

## Phrase de la page finale

Dans `index.html`, balise `<h2 class="match-title">`.

## Contraste

Le blanc sur #F6B12D ne fait que 1,9:1 (page finale demandée en blanc). Une ombre verte douce a été ajoutée au texte pour le garder lisible. Pour un meilleur contraste, passer `color` de `.match-title` à `#4B5943` dans `css/style.css`.

## Mise à jour automatique (GitHub)

Le fichier `.github/workflows/deploy.yml` publie l'application sur GitHub Pages à chaque push sur la branche `main`.

1. Créer un dépôt GitHub et y envoyer le contenu du dossier `datingbb` (le dossier `.github` doit être à la racine du dépôt).
2. Sur GitHub : Settings, Pages, Source : choisir "GitHub Actions".
3. Faire un push : l'onglet Actions montre la vérification, puis le déploiement.
4. L'application est disponible sur https://TON-PSEUDO.github.io/NOM-DU-DEPOT/ (utilisable directement sur téléphone).

Avant chaque publication, le workflow vérifie que `proposals.json` est valide et que toutes les photos listées existent. Pour mettre à jour l'application : ajouter les photos, modifier le code, puis `git push`.

## Licences

- Polices Plus Jakarta Sans et DM Sans : licence SIL Open Font License (texte dans `fonts/`). Elles peuvent être utilisées et redistribuées avec l'application.
- Le code, le nom Datingb.b, la cerise et les portraits illustrés appartiennent à industryb.b.
