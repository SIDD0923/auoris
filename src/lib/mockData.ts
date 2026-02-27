export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  language?: string;
  content?: string;
}

export const fileTree: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "App.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="app-body">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}`,
          },
          {
            name: "Header.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';

interface HeaderProps {
  title?: string;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = "Auris IDE", 
  username = "Developer" 
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <nav className="header-nav">
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
      <div className="header-right">
        <span>{username}</span>
        <img src="/avatar.png" alt="avatar" />
      </div>
    </header>
  );
};`,
          },
          {
            name: "Sidebar.tsx",
            type: "file",
            language: "typescript",
            content: `import React, { useState } from 'react';

interface SidebarItem {
  icon: string;
  label: string;
  path: string;
}

const menuItems: SidebarItem[] = [
  { icon: '📁', label: 'Explorer', path: '/explorer' },
  { icon: '🔍', label: 'Search', path: '/search' },
  { icon: '🔀', label: 'Source Control', path: '/git' },
  { icon: '🧩', label: 'Extensions', path: '/extensions' },
];

export const Sidebar: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <aside className="sidebar">
      {menuItems.map((item, index) => (
        <button
          key={item.path}
          className={\`sidebar-item \${active === index ? 'active' : ''}\`}
          onClick={() => setActive(index)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}
    </aside>
  );
};`,
          },
          {
            name: "MainContent.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';

export const MainContent: React.FC = () => {
  return (
    <main className="main-content">
      <div className="welcome">
        <h2>Welcome to Auris IDE</h2>
        <p>Start by opening a file from the explorer.</p>
      </div>
    </main>
  );
};`,
          },
        ],
      },
      {
        name: "utils",
        type: "folder",
        children: [
          {
            name: "helpers.ts",
            type: "file",
            language: "typescript",
            content: `export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}`,
          },
          {
            name: "constants.ts",
            type: "file",
            language: "typescript",
            content: `export const API_BASE_URL = 'https://api.auris.dev/v1';

export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'html',
  'css',
  'json',
  'markdown',
  'yaml',
  'toml',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const EDITOR_THEMES = {
  dark: 'vs-dark',
  light: 'vs-light',
  highContrast: 'hc-black',
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_TABS = 20;`,
          },
        ],
      },
      {
        name: "styles",
        type: "folder",
        children: [
          {
            name: "globals.css",
            type: "file",
            language: "css",
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #1e1e2e;
  --bg-secondary: #181825;
  --bg-tertiary: #11111b;
  --text-primary: #cdd6f4;
  --text-secondary: #a6adc8;
  --accent: #89b4fa;
  --accent-hover: #74c7ec;
  --border: #313244;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  height: 100vh;
}`,
          },
        ],
      },
      {
        name: "index.ts",
        type: "file",
        language: "typescript",
        content: `export { default as App } from './components/App';
export { Header } from './components/Header';
export { Sidebar } from './components/Sidebar';
export { MainContent } from './components/MainContent';
export { formatDate, debounce, classNames } from './utils/helpers';`,
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      {
        name: "favicon.ico",
        type: "file",
      },
      {
        name: "logo.svg",
        type: "file",
        language: "xml",
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#89b4fa" />
  <text x="50" y="55" text-anchor="middle" fill="white" font-size="24">A</text>
</svg>`,
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    language: "json",
    content: `{
  "name": "auris-ide",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@monaco-editor/react": "^4.6.0",
    "lucide-react": "^0.300.0"
  }
}`,
  },
  {
    name: "tsconfig.json",
    type: "file",
    language: "json",
    content: `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
  },
  {
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# Auris IDE

A modern web-based IDE built with Next.js, React, and Monaco Editor.

## Features

- 🗂 File Explorer with tree navigation  
- ✏️ Monaco Editor with syntax highlighting
- 🔍 Integrated search
- 🖥 Built-in terminal
- 🤖 AI Assistant panel
- 🎨 Dark theme with modern gradients

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the IDE.
`,
  },
];

export const mockTerminalHistory = [
  { type: "input" as const, text: "$ npm install" },
  {
    type: "output" as const,
    text: "added 436 packages, and audited 437 packages in 12s\n\n176 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities",
  },
  { type: "input" as const, text: "$ npm run dev" },
  {
    type: "output" as const,
    text: "  ▲ Next.js 15.2.4\n  - Local:    http://localhost:3000\n  - Network:  http://192.168.1.42:3000\n\n ✓ Starting...\n ✓ Ready in 1.8s",
  },
];

export const mockProblems = [
  {
    type: "warning" as const,
    file: "src/components/Header.tsx",
    line: 12,
    message: "'username' is defined but never used.",
  },
  {
    type: "error" as const,
    file: "src/utils/helpers.ts",
    line: 24,
    message: "Type 'string | undefined' is not assignable to type 'string'.",
  },
  {
    type: "warning" as const,
    file: "src/components/Sidebar.tsx",
    line: 8,
    message: "Unexpected any. Specify a different type.",
  },
];

export const mockGitChanges = [
  { file: "src/components/App.tsx", status: "modified" as const },
  { file: "src/utils/helpers.ts", status: "modified" as const },
  { file: "src/components/NewWidget.tsx", status: "added" as const },
  { file: "src/old/legacy.ts", status: "deleted" as const },
];

export const mockExtensions = [
  {
    name: "ESLint",
    publisher: "Microsoft",
    description: "Integrates ESLint JavaScript into VS Code.",
    installed: true,
  },
  {
    name: "Prettier",
    publisher: "Prettier",
    description: "Code formatter using prettier.",
    installed: true,
  },
  {
    name: "GitLens",
    publisher: "GitKraken",
    description: "Supercharge Git within VS Code.",
    installed: false,
  },
  {
    name: "Thunder Client",
    publisher: "Thunder Client",
    description: "Lightweight Rest API Client for VS Code.",
    installed: false,
  },
  {
    name: "Tailwind CSS IntelliSense",
    publisher: "Tailwind Labs",
    description: "Intelligent Tailwind CSS tooling.",
    installed: true,
  },
];
