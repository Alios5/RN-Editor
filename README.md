# 🎵 RhythmNator Editor

A desktop rhythm/music editor built with **Tauri v2**, **React**, **TypeScript**, and **Tailwind CSS**. Create, edit, and organize rhythm patterns synced to audio tracks with a visual timeline interface.

## ✨ Features

- **Audio Waveform Editor** — Load audio files and visualize waveforms with [WaveSurfer.js](https://wavesurfer.xyz/), with playback controls and real-time BPM detection
- **Multi-Track Timeline** — Create multiple tracks with notes placed on a rhythmic grid, synced to the audio
- **Rhythm Grid** — Configurable grid with beat/measure lines, snapping, and zoom controls
- **Notes & Actions** — Place note blocks on tracks and assign specific actions to each note
- **Track Groups** — Organize tracks into named groups with color coding
- **Drag & Drop** — Reorder tracks and panels via drag-and-drop (powered by dnd-kit)
- **Resizable Panels** — Flexible layout with resizable sidebar panels (audio, tracks, project info, groups)
- **Theme Editor** — Full theme customization with built-in themes (Amethyst, Default Dark, Light, Gold Night, Winter) and support for custom themes (import/export `.rntheme` files)
- **Project Management** — Create, duplicate, rename, and delete projects. Each project is saved as a `.rne` file
- **Keyboard Shortcuts** — Comprehensive shortcut system for playback, editing, navigation, and more
- **Localization** — English and French (i18n) with language switcher
- **Custom Font Selection** — Choose from multiple fonts for titles and body text
- **Custom Title Bar** — Native-like frameless window with custom window controls
- **Window State Persistence** — Remembers window size and position between sessions

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | [Tauri v2](https://v2.tauri.app/) (Rust backend) |
| Frontend framework | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Audio visualization | [WaveSurfer.js](https://wavesurfer.xyz/) |
| BPM detection | [realtime-bpm-analyzer](https://www.npmjs.com/package/realtime-bpm-analyzer) |
| Drag & drop | [dnd-kit](https://dndkit.com/) |
| Icons | [Lucide React](https://lucide.dev/) + [Font Awesome](https://fontawesome.com/) |
| Routing | [React Router v6](https://reactrouter.com/) |

## 📋 Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Rust** toolchain (for Tauri) — [Install Rust](https://www.rust-lang.org/tools/install)
- **Tauri v2 prerequisites** — [Platform-specific setup](https://v2.tauri.app/start/prerequisites/)

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Alios5/RN-Editor.git
cd RN-Editor

# Install dependencies
npm install

# Run the desktop app in development mode
npm run tauri dev
```

### Other scripts

```bash
# Frontend dev server only (no Tauri window)
npm run dev

# Build the production desktop app
npm run tauri build

# Lint the codebase
npm run lint
```

## 📁 Project Structure

```
RN-Editor/
├── src/                    # React frontend
│   ├── components/         # UI components (editor panels, dialogs, tracks...)
│   │   └── ui/             # shadcn/ui base components
│   ├── contexts/           # React contexts (Language, Font)
│   ├── hooks/              # Custom hooks (shortcuts, window, audio...)
│   ├── locales/            # i18n translation files (en, fr)
│   ├── pages/              # Pages (Projects, Editor, NotFound)
│   ├── types/              # TypeScript types (project, track, note, theme...)
│   ├── utils/              # Utilities (theme manager, project storage, audio...)
│   ├── index.css           # Global styles & CSS design tokens
│   └── App.tsx             # Root component with routing
├── src-tauri/              # Tauri/Rust backend
│   ├── src/                # Rust source code
│   ├── icons/              # App icons
│   └── tauri.conf.json     # Tauri configuration
└── package.json
```

## 🎨 Themes

RhythmNator includes **5 built-in themes**:

| Theme | Description |
|-------|-------------|
| **Amethyst** | Deep purple with violet accents |
| **Default Dark** | Classic dark blue-indigo |
| **Light** | Clean light theme |
| **Gold Night** | Dark with golden accents |
| **Winter** | Cool blue/white winter palette |

Custom themes can be created via the built-in **Theme Editor**, exported as `.rntheme` files, and shared with others.

## 📄 File Formats

| Extension | Description |
|-----------|-------------|
| `.rne` | RhythmNator project file (JSON, compressed with pako/gzip) |
| `.rntheme` | Theme file (JSON) |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `Ctrl+S` | Save project |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Delete` | Delete selected notes |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `?` | Show all shortcuts |

## 📝 License

This project is private.
