# 🌍 Guide de Traduction - RhythmNator Editor

Ce guide explique comment fonctionne le système de traduction multilingue de RhythmNator Editor et comment ajouter de nouvelles langues.

## 📁 Structure des Fichiers

```
/src
  ├─ /locales              # Fichiers de traduction
  │   ├─ en.json           # Anglais (langue par défaut)
  │   ├─ fr.json           # Français
  │   └─ [votre_langue].json
  ├─ /contexts
  │   └─ LanguageContext.tsx   # Contexte de gestion des langues
  ├─ /hooks
  │   └─ useTranslation.ts     # Hook pour accéder aux traductions
  └─ /components
      └─ LanguageSelector.tsx  # Sélecteur de langue UI
```

## 🚀 Utilisation dans les Composants

### Import du hook

```tsx
import { useTranslation } from "@/hooks/useTranslation";
```

### Utilisation de base

```tsx
const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t("app.name")}</h1>
      <p>{t("project.noProjects")}</p>
    </div>
  );
};
```

### Traductions avec paramètres

```tsx
const MyComponent = () => {
  const { t } = useTranslation();
  const projectName = "Mon Projet";
  
  return (
    <div>
      {/* Utilise {name} dans le fichier de traduction */}
      <p>{t("project.createSuccess", { name: projectName })}</p>
    </div>
  );
};
```

### Changer la langue

```tsx
const MyComponent = () => {
  const { language, setLanguage } = useTranslation();
  
  return (
    <button onClick={() => setLanguage("fr")}>
      Langue actuelle: {language}
    </button>
  );
};
```

## 📝 Format des Fichiers de Traduction

Les fichiers de traduction sont au format JSON avec une structure hiérarchique :

```json
{
  "category": {
    "key": "Traduction",
    "keyWithParam": "Bonjour {name} !",
    "nested": {
      "deepKey": "Valeur profonde"
    }
  }
}
```

### Exemple complet

**en.json**
```json
{
  "app": {
    "name": "RhythmNator Editor"
  },
  "project": {
    "create": "Create Project",
    "createSuccess": "Project \"{name}\" created successfully!"
  }
}
```

**fr.json**
```json
{
  "app": {
    "name": "RhythmNator Editor"
  },
  "project": {
    "create": "Créer un Projet",
    "createSuccess": "Projet \"{name}\" créé avec succès !"
  }
}
```

## ➕ Ajouter une Nouvelle Langue

### Étape 1 : Créer le fichier de traduction

Créez un nouveau fichier dans `/src/locales/` avec le code ISO de la langue :

```
/src/locales/es.json  (Espagnol)
/src/locales/de.json  (Allemand)
/src/locales/it.json  (Italien)
```

### Étape 2 : Copier la structure depuis en.json

Copiez le contenu de `en.json` et traduisez tous les textes :

```json
{
  "app": {
    "name": "RhythmNator Editor"
  },
  "project": {
    "create": "Crear Proyecto",
    "createSuccess": "¡Proyecto \"{name}\" creado con éxito!"
  }
}
```

### Étape 3 : Enregistrer la langue dans le contexte

Modifiez `/src/contexts/LanguageContext.tsx` :

```tsx
import esTranslations from "@/locales/es.json";

type Language = "en" | "fr" | "es"; // Ajouter votre langue

const translationsMap: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations, // Ajouter votre langue
};

export const availableLanguages = [
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
  { code: "es" as Language, name: "Español", flag: "🇪🇸" }, // Ajouter votre langue
];
```

### Étape 4 : Tester

La nouvelle langue apparaîtra automatiquement dans le sélecteur de langue !

## 🔑 Clés de Traduction Disponibles

### App
- `app.name` - Nom de l'application
- `app.title` - Titre de l'application

### Menu
- `menu.file`, `menu.edit`, `menu.view`, `menu.help`, `menu.language`

### Actions
- `actions.open`, `actions.save`, `actions.saveAs`, `actions.export`
- `actions.create`, `actions.delete`, `actions.cancel`, `actions.confirm`
- `actions.undo`, `actions.redo`, `actions.copy`

### Project
- `project.title`, `project.new`, `project.open`, `project.recent`
- `project.projectName`, `project.projectFolder`, `project.music`
- `project.createSuccess`, `project.deleteSuccess`, `project.saveSuccess`

### Track
- `track.title`, `track.create`, `track.edit`, `track.delete`
- `track.trackName`, `track.trackColor`

### Audio
- `audio.title`, `audio.loadAudio`, `audio.bpm`, `audio.volume`
- `audio.copyMusic`, `audio.loadSuccess`, `audio.copySuccess`

### Editor
- `editor.waveform`, `editor.backToProjects`, `editor.saveProject`

### Validation
- `validation.nameRequired`, `validation.nameTooShort`, `validation.nameTooLong`

## 🛠️ Fonctionnalités Techniques

### Sauvegarde de la Préférence
La langue sélectionnée est sauvegardée dans `localStorage` et restaurée au prochain lancement.

### Langue par Défaut
Si aucune langue n'est sauvegardée, l'anglais est utilisé par défaut.

### Gestion des Clés Manquantes
Si une clé de traduction n'existe pas, la clé brute est retournée et un avertissement est affiché dans la console.

### Support des Paramètres
Les traductions supportent les paramètres dynamiques avec la syntaxe `{nomParametre}`.

## 🤝 Contribution Communautaire

Les contributions de traduction sont les bienvenues ! Pour ajouter votre langue :

1. Fork le projet
2. Créez votre fichier de traduction `[code_langue].json`
3. Traduisez toutes les clés
4. Mettez à jour `LanguageContext.tsx`
5. Créez une Pull Request

### Template pour Nouvelle Langue

```json
{
  "app": { "name": "", "title": "" },
  "menu": { "file": "", "edit": "", "view": "", "help": "", "language": "" },
  "actions": { "open": "", "save": "", "create": "", "delete": "", "cancel": "" },
  "project": { 
    "title": "", "new": "", "open": "", "recent": "",
    "noProjects": "", "noProjectsDescription": "", "createProject": ""
  }
  // ... continuez avec toutes les clés de en.json
}
```

## 📞 Support

Pour toute question sur le système de traduction, ouvrez une issue sur GitHub avec le tag `translation`.

---

**Merci de contribuer à rendre RhythmNator Editor accessible à tous ! 🌍**
