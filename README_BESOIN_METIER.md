# Plateforme BTP Full-Stack — De l'appel d'offre à la livraison

## Document de cadrage fonctionnel et métier

---

## 1. Vision du produit

Le secteur du BTP français (~50 000 PME de 1 à 30 salariés) fonctionne aujourd'hui avec un **écosystème logiciel fragmenté** : un outil pour le chiffrage, un autre pour le suivi de chantier, un tableur Excel pour le planning, un logiciel tiers pour la facturation. À chaque changement d'outil, l'information est ressaisie, perdue ou désynchronisée.

**L'objectif de cette plateforme est de couvrir l'intégralité du cycle de vie d'un projet BTP dans un seul environnement cohérent**, depuis la détection d'un appel d'offres jusqu'à l'archivage du chantier livré, en passant par le chiffrage, l'exécution et la facturation.

Le produit est volontairement **générique** : il ne s'adresse pas à un corps de métier particulier (électricien, plombier, maçon) mais à toute PME ou artisan du bâtiment, quel que soit son domaine d'intervention, en s'appuyant sur des modèles de prix et des workflows configurables plutôt que sur des bibliothèques métier figées.

### 1.1 Constat de marché

- Le secteur BTP concentre une défaillance d'entreprise sur quatre, principalement liée à une érosion de la marge opérationnelle mal anticipée.
- Le marché actuel est scindé en deux familles d'outils :
  - des suites généralistes lourdes (Odoo, EBP, Sage) qui couvrent large mais avec une UX complexe et un onboarding de plusieurs dizaines d'heures ;
  - des outils spécialisés (Batappli, Obat, BatiChiffrage) qui excellent sur le chiffrage ou la facturation mais laissent le suivi de chantier et le pilotage financier en dehors du périmètre, ou le traitent superficiellement.
- Aucun acteur du marché ne couvre aujourd'hui la totalité de la chaîne **appel d'offres → chiffrage → exécution → facturation → archivage** dans un outil unique pensé pour la PME généraliste (par opposition aux gros ERP pour économistes de la construction).

### 1.2 Proposition de valeur

Une entreprise qui utilise la plateforme doit pouvoir :

1. repérer et qualifier une opportunité commerciale en quelques minutes ;
2. répondre à un dossier de consultation sans ressaisie entre l'analyse du dossier, le métré, le chiffrage et le document de réponse financière ;
3. transformer automatiquement une offre gagnée en projet d'exécution structuré ;
4. suivre l'avancement du chantier et sa rentabilité en temps réel, y compris depuis le terrain via mobile ;
5. générer les situations de travaux et factures sans double saisie ;
6. archiver le projet et capitaliser sur les écarts constatés pour améliorer les futurs chiffrages.

---

## 2. Le cycle de vie complet du projet BTP

Le produit est structuré en cinq phases séquentielles, formant une chaîne continue de données. Une donnée saisie une seule fois (une quantité, un prix, un intervenant) doit circuler sans ressaisie à travers toutes les phases suivantes.

```
Phase 1                Phase 2                  Phase 3                  Phase 4                   Phase 5
Détection      -->      Réponse à       -->      Exécution        -->    Facturation      -->      Archivage
d'opportunité            l'appel d'offre          & suivi                 & paiement                & capitalisation
```

Chaque phase est détaillée ci-dessous avec, pour chacune : le constat du besoin non couvert aujourd'hui, la réponse fonctionnelle apportée par la plateforme, et la valeur métier concrète pour l'utilisateur.

---

## 3. Phase 1 — Détection et qualification d'opportunité

### 3.1 Constat

Les PME du BTP reçoivent des opportunités commerciales par des canaux disparates : plateformes de marchés publics (BOAMP, plateformes régionales), sollicitations directes par email ou téléphone, appels d'offres transmis par des maîtres d'œuvre partenaires. Il n'existe aujourd'hui aucun outil qui centralise ces flux et aide à la décision de répondre ou non ("bid/no-bid"), décision pourtant structurante car répondre à un dossier mal calibré représente plusieurs heures de travail non rémunérées et non gagnées.

### 3.2 Réponse apportée

- **Agrégation multi-sources** : centralisation des opportunités provenant de plateformes de marchés publics, de sollicitations privées et de demandes directes, dans un flux unique et consultable.
- **Fiche de qualification rapide** : à réception d'une opportunité, extraction automatique des informations clés (montant estimé, délai de réponse, nature des travaux, localisation) pour permettre une décision rapide.
- **Aide à la décision bid/no-bid** : mise en regard de la charge de réponse estimée, de la capacité de production disponible de l'entreprise sur la période concernée, et du taux de réussite historique sur des projets similaires.
- **Historique de scoring** : capitalisation sur les décisions passées (offres gagnées, perdues, déclinées) pour affiner progressivement le calibrage des futures décisions.

### 3.3 Valeur métier

Réduction du temps passé à trier des opportunités non pertinentes, et concentration de l'effort commercial sur les dossiers à plus fort potentiel de conversion.

---

## 4. Phase 2 — Réponse à l'appel d'offre

Cette phase est le cœur technique du produit : c'est ici que se concentre la plus grande fragmentation d'outils sur le marché actuel, et donc la plus forte opportunité de différenciation.

### 4.1 Analyse du dossier de consultation (DCE)

**Constat.** Un dossier de consultation des entreprises (DCE) comprend fréquemment un CCTP (cahier des clauses techniques particulières), un règlement de consultation, des plans, un bordereau de prix et diverses annexes réglementaires, pour un total pouvant dépasser cinquante pages. Sa lecture et son interprétation représentent à elles seules 20 à 30 % du temps total consacré à la réponse. Un point technique ou une clause de risque mal identifiée conduit à une offre inadaptée, techniquement ou financièrement.

**Réponse apportée.**
- Import du DCE (PDF et documents annexes) avec extraction automatique assistée par IA des informations structurantes : nature des travaux, délais, critères de sélection et leur pondération, contraintes techniques particulières, clauses de risque.
- Génération automatique d'une fiche de lecture synthétique tenant sur une page, reprenant les points d'attention majeurs du dossier.
- Détection des exigences réglementaires ou de qualification associées (RGE, PPSPS, habilitations particulières) pour vérifier en amont l'éligibilité de l'entreprise à répondre.
- Lorsque le DCE contient des quantités déjà chiffrées (bordereau, DQE), extraction automatique de cette base pour alimenter directement le chiffrage, sans ressaisie.

**Valeur métier.** Réduction drastique du temps d'analyse et sécurisation de la complétude de la réponse : aucun point contractuel majeur n'est laissé de côté.

### 4.2 Métrés (relevé de quantités)

**Constat.** Lorsque le DCE ne fournit pas de quantités déjà établies, l'entreprise doit les calculer elle-même à partir des plans fournis, en général au format PDF. Cette opération manuelle est chronophage (plusieurs heures pour un projet de taille moyenne) et sujette à erreur : une surface ou une longueur omise se traduit directement par une offre sous-évaluée et une perte financière sur le chantier.

**Réponse apportée.**
- Outil de relevé de quantités semi-automatisé directement sur les plans importés : traçage de surfaces, longueurs et quantités d'ouvrages avec calcul automatique.
- Organisation des quantités relevées par lot et par poste, en cohérence avec la structure du CCTP, pour un raccordement direct au chiffrage.
- Comparaison avec l'historique de projets similaires déjà réalisés par l'entreprise, afin de signaler les écarts significatifs susceptibles de révéler un oubli.

**Valeur métier.** Fiabilisation des quantités, réduction du temps de métré, et diminution du risque de sous-évaluation d'une offre.

### 4.3 Chiffrage

**Constat.** C'est l'étape la plus critique du cycle : construire, à partir des quantités relevées, un prix de vente cohérent avec les coûts réels de l'entreprise (déboursé sec, frais généraux, marge). Chaque entreprise a sa propre logique de prix (à l'heure, au forfait, au m², en déboursé plus marge), ses propres coûts d'approvisionnement et ses propres marges cibles selon le type de prestation. Les bibliothèques de prix génériques du marché ne reflètent pas cette réalité individuelle et nécessitent un ajustement manuel systématique. Un article oublié dans le chiffrage se traduit par un manque à gagner sur le chantier, invisible tant que le contrôle n'est pas fait a posteriori.

**Réponse apportée.**
- Modèles de prix configurables par l'entreprise (taux horaire, prix au forfait, prix au m², déboursé sec avec coefficients de marge), sans dépendance à une bibliothèque de prix figée par métier.
- Bibliothèque de prix propre à l'entreprise, alimentée et enrichie au fil des chiffrages, avec possibilité d'import de bibliothèques existantes.
- Mise en correspondance assistée entre les articles du CCTP et les prix de l'entreprise, avec suggestion automatique lorsqu'un article similaire a déjà été chiffré par le passé.
- Application automatique des règles de marge définies une fois pour toutes par l'entreprise (par exemple : marge différenciée sur main-d'œuvre et sur matériaux), avec possibilité d'ajustement ponctuel par chantier.
- Suivi de l'évolution des prix dans le temps (coût horaire, prix matériaux) pour fiabiliser progressivement les futurs chiffrages.
- Contrôle de complétude : vérification automatique que chaque article présent dans le CCTP dispose bien d'un prix associé avant validation du chiffrage, avec alerte en cas d'omission.

**Valeur métier.** C'est le point de gestion numéro un du secteur : un chiffrage fiable et complet est la condition de la rentabilité du chantier. Cette fonctionnalité constitue l'ossature financière de l'ensemble du projet, car chaque phase ultérieure (planning, suivi, facturation, contrôle de marge) s'appuie sur les données établies ici.

### 4.4 Constitution de la réponse financière (DPGF)

**Constat.** La décomposition du prix global et forfaitaire (DPGF), ou tout document assimilé demandé par le maître d'ouvrage, doit être remise dans un format et une structure imposés par chaque appel d'offres (répartition en lots, chapitres, variantes). Sa saisie manuelle, en recopiant les données du chiffrage dans un tableur imposé, est une source fréquente d'erreurs et de pertes de temps.

**Réponse apportée.**
- Génération automatique du document de réponse financière à partir des données de chiffrage, dans la structure attendue par le dossier de consultation.
- Contrôles de cohérence avant export : correspondance entre les articles chiffrés et les articles attendus, cohérence des totaux, complétude des variantes le cas échéant.
- Export dans les formats exploitables par le maître d'ouvrage (PDF, tableur).

**Valeur métier.** Élimination de la ressaisie et du risque d'erreur entre le chiffrage interne et le document remis, gain de temps important sur la dernière ligne droite avant la date limite de dépôt.

---

## 5. Phase 3 — Exécution et suivi de chantier

### 5.1 Constat

Une fois le marché remporté, la majorité des outils existants déconnectent totalement le chiffrage initial du suivi d'exécution. Le devis qui prévoyait 200 heures de main-d'œuvre sur un poste peut en consommer 240 en réalité, sans que personne ne s'en aperçoive avant la clôture du chantier — au moment où il est trop tard pour agir. La coordination d'équipes intervenant sur plusieurs chantiers en parallèle est également une source récurrente de retards et de tensions.

### 5.2 Réponse apportée

- **Conversion automatique de l'offre en projet d'exécution** : la structure du chiffrage gagné (lots, phases, quantités, budgets) devient directement la structure du planning d'exécution, sans ressaisie.
- **Planification et affectation des ressources** : répartition des équipes et des sous-traitants par phase et par chantier, avec vision de la charge de travail disponible pour éviter les conflits d'affectation entre chantiers simultanés.
- **Suivi terrain mobile** : interface simplifiée permettant à un chef de chantier de signaler l'avancement d'une tâche (validation, photo, commentaire libre) directement depuis un téléphone, sans nécessiter de formation ni de saisie complexe.
- **Suivi du budget en temps réel** : comparaison continue entre les heures et coûts estimés au chiffrage et les heures et coûts réellement engagés, phase par phase.
- **Alertes proactives** : signalement automatique dès qu'un écart significatif apparaît entre le prévisionnel et le réel sur une phase, ou qu'un retard sur un chantier menace d'impacter l'affectation d'une équipe sur un autre chantier.
- **Journal des réserves et non-conformités** : suivi des points restant à traiter avant réception, avec statut de levée.

### 5.3 Valeur métier

Le suivi financier en temps réel transforme le pilotage du chantier : l'entreprise identifie une dérive de marge alors qu'elle est encore possible d'agir, et non après coup lors du bilan final. La coordination multi-chantiers réduit les temps morts d'équipe et les conflits de planning.

---

## 6. Phase 4 — Facturation et suivi de paiement

### 6.1 Constat

Le passage entre exécution et facturation est aujourd'hui un point de friction majeur. Beaucoup d'artisans facturent uniquement en début et fin de chantier, faute d'outil simple pour établir des situations de travaux intermédiaires, ce qui dégrade leur trésorerie et la lisibilité du chantier pour le client. La facturation électronique devient par ailleurs obligatoire de façon progressive, ce qui impose une conformité technique renforcée.

### 6.2 Réponse apportée

- **Génération automatique des situations de travaux** : à partir du pourcentage d'avancement suivi en phase d'exécution, génération d'une situation intermédiaire pré-remplie, respectant la structure en lots définie au chiffrage.
- **Application automatique des clauses contractuelles** : retenues de garantie, acomptes, pénalités ou bonifications définies au contrat, appliquées sans intervention manuelle.
- **Facture finale consolidée** : calcul automatique à partir du cumul des situations, des heures supplémentaires éventuelles et des ajustements de fin de chantier.
- **Conformité à la facturation électronique** : génération de factures dans les formats requis par la réglementation en vigueur.
- **Suivi des encaissements** : rapprochement entre factures émises et paiements reçus, avec relances automatiques en cas de retard.

### 6.3 Valeur métier

Amélioration de la trésorerie par une facturation intermédiaire plus fréquente et plus fiable, sécurisation de la conformité réglementaire, et réduction du délai moyen de paiement grâce au suivi et aux relances automatisées.

---

## 7. Phase 5 — Archivage et capitalisation

### 7.1 Constat

À la clôture d'un chantier, les documents produits (devis, plans, situations, factures, photos, échanges) restent dispersés entre différents outils et boîtes mail, sans centralisation. Aucune analyse structurée de la rentabilité réelle du chantier n'est réalisée, ce qui prive l'entreprise d'un retour d'expérience qui améliorerait ses futurs chiffrages.

### 7.2 Réponse apportée

- **Dossier projet centralisé** : archivage de l'ensemble des documents du chantier (DCE, chiffrage, planning, situations, factures, photos) dans un espace unique et consultable.
- **Analyse de rentabilité finale** : comparaison entre le budget chiffré initialement et les coûts réellement engagés, avec décomposition par poste (main-d'œuvre, matériaux, sous-traitance).
- **Capitalisation sur les écarts constatés** : mise en évidence des tendances récurrentes (par exemple une sous-estimation systématique de la main-d'œuvre sur un type de prestation), afin d'ajuster automatiquement les futurs chiffrages de l'entreprise.

### 7.3 Valeur métier

Transformation de chaque chantier terminé en donnée d'apprentissage exploitable, avec un effet d'amélioration continue de la précision des chiffrages au fil du temps — un avantage qu'aucun outil du marché actuel ne propose de façon structurée.

---

## 8. Synthèse des besoins couverts par phase

| Phase | Besoin non couvert par le marché actuel | Réponse apportée |
|---|---|---|
| Détection | Centralisation des opportunités et aide à la décision de répondre | Agrégation multi-sources, fiche de qualification, scoring historique |
| Analyse DCE | Lecture manuelle chronophage et risque d'omission | Extraction assistée par IA, fiche de synthèse, détection des risques |
| Métrés | Relevé manuel long et sujet à erreur | Traçage semi-automatique sur plans, comparaison historique |
| Chiffrage | Absence de flexibilité des modèles de prix, risque d'oubli d'articles | Modèles configurables, bibliothèque propre, contrôle de complétude |
| DPGF | Ressaisie manuelle dans un format imposé | Génération automatique conforme, contrôles de cohérence |
| Exécution | Déconnexion totale entre devis et suivi de chantier | Conversion automatique devis → projet, suivi budgétaire temps réel |
| Suivi terrain | Outils web peu adaptés au terrain | Interface mobile simplifiée, remontée photo et statut |
| Facturation | Absence de facturation intermédiaire structurée | Situations automatiques, facture finale consolidée, conformité électronique |
| Archivage | Dispersion des documents, absence d'analyse de rentabilité | Dossier centralisé, analyse estimé vs réel, capitalisation |

---

## 9. Positionnement et différenciation

Le marché actuel oblige une PME du BTP à choisir entre :

- un outil généraliste tout-en-un (type ERP), puissant mais lourd, coûteux et long à mettre en œuvre ;
- une combinaison d'outils spécialisés, plus simples individuellement mais générant des ruptures de données à chaque interface entre deux logiciels (formats incompatibles, doublons, versions contradictoires d'un même document).

La proposition de cette plateforme est de rester **simple d'usage comme un outil spécialisé**, tout en couvrant **l'intégralité de la chaîne comme un ERP**, grâce à une architecture de données unifiée où chaque information n'est saisie qu'une seule fois et circule automatiquement d'une phase à l'autre.

Le caractère générique du produit (non lié à un corps de métier) élargit son marché adressable et évite l'écueil d'une bibliothèque de prix figée, en misant à la place sur la configurabilité des modèles de prix et des workflows.

---

## 10. Cible et marché adressable

- **Cible principale** : PME et artisans du BTP de 1 à 30 salariés, tous corps de métier confondus, gérant plusieurs chantiers en parallèle.
- **Taille de marché** : environ 50 000 entreprises en France correspondant à ce profil.
- **Élargissement possible** : marché européen francophone et pays limitrophes partageant des problématiques structurelles similaires (Belgique, Suisse romande).
