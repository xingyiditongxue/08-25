Plan d'Action

Création des Constantes Spécifiques au Modèle Kimi
1.1. Créer un nouveau fichier : src/common/internal/models/llm/tokenInfo/LlmTokenInfo.kimi.constants.ts.
1.2. Dans ce nouveau fichier, définir et exporter les constantes KIMI_CONTEXT_WINDOW_SIZE et KIMI_MAX_TOKENS_PER_REQUEST avec les valeurs appropriées pour le modèle Kimi-K2.

Création du Modèle de Step pour Kimi
3.1. Créer le fichier src/common/internal/models/steps/kimi/Kimi.step.ts.
3.2. Importer les constantes KIMI_CONTEXT_WINDOW_SIZE et KIMI_MAX_TOKENS_PER_REQUEST depuis le fichier LlmTokenInfo.kimi.constants.ts créé à l'étape 1.
3.3. Définir et exporter l'objet kimiTokenInfo en utilisant les constantes Kimi importées, corrigeant ainsi l'erreur de contamination logique.
3.4. Définir et exporter la classe KimiStep.

Intégration du Modèle de Step Kimi
5.1. Ouvrir le fichier src/common/internal/models/steps/Llm.steps.constants.ts.
5.2. Ajouter l'import pour KimiStep. L'import doit être inséré en respectant l'ordre alphabétique.
5.3. Ajouter une entrée pour le modèle 'moonshotai/kimi-k2' dans la constante LLM_STEPS, en l'associant à KimiStep.

Mise à Jour des Types de Modèles
6.1. Ouvrir le fichier src/common/internal/models/llm/Llm.types.ts.
6.2. Ajouter l'identifiant 'moonshotai/kimi-k2' à la définition du type LlmId.

Ajout du Modèle à l'Interface Utilisateur
7.1. Ouvrir le fichier src/ui/views/App/components/LlmProviderSelector/LlmProviderSelector.constants.ts.
7.2. Ajouter une nouvelle entrée pour le modèle Kimi-K2 dans la constante LLM_PROVIDERS pour le rendre sélectionnable par l'utilisateur.

Fichiers à Modifier ou vérifier

src/common/internal/models/llm/tokenInfo/LlmTokenInfo.kimi.constants.ts
src/common/internal/services/llm/oxaHub/OxaHubOpenRouterApiKimiK2.ts
src/common/internal/models/steps/kimi/Kimi.step.ts
src/common/internal/services/llm/llmApi/LlmApi.constants.ts
src/common/internal/models/steps/Llm.steps.constants.ts
src/common/internal/models/llm/Llm.types.ts
src/ui/views/App/components/LlmProviderSelector/LlmProviderSelector.constants.ts

Google Search Suggestions
Display of Search Suggestions is required when using Grounding with Google Search. Learn more
plan d'action pour ajouter un nouveau modèle LLM à une extension chrome vue.js typescript
bonnes pratiques import typescript ordre alphabétique
vue.js typescript chrome extension architecture
