// Browse categories. A tool joins every category whose keywords appear in its GitHub topics, name or description.
// ponytail: keyword lists, not a classifier; extend a list when a tool lands in the wrong place.
export const CATEGORIES = [
  { slug: "ai", name: "AI and LLMs", blurb: "Run models locally, build agents, generate text and images.",
    keywords: ["ai", "llm", "llms", "gpt", "agent", "inference", "machine learning", "machine-learning", "deep-learning", "neural", "diffusion", "llama", "qwen", "openai", "claude", "embedding", "transformer", "rag", "whisper", "speech-to-text", "ollama", "model", "models"] },
  { slug: "self-hosted", name: "Self hosted", blurb: "Run your own services instead of renting someone else's.",
    keywords: ["self-hosted", "selfhosted", "self-hostable", "self-host", "selfhost", "homelab", "home server", "home-server", "home-automation", "home assistant"] },
  { slug: "cli", name: "Terminal and CLI", blurb: "Faster shells, better prompts, tools that live in the terminal.",
    keywords: ["cli", "terminal", "shell", "tui", "command-line", "command line", "tmux", "zsh", "bash", "fish", "coreutils", "terminal emulator"] },
  { slug: "dev", name: "Developer tools", blurb: "Editors, git helpers, debuggers and everything around writing code.",
    keywords: ["git", "lsp", "language server", "language-server", "debugger", "debugging", "linter", "formatter", "ide", "editor", "vscode", "emacs", "vim", "neovim", "devtools", "developer-tools", "testing", "profiler", "code review", "completion", "coding"] },
  { slug: "infra", name: "DevOps and infrastructure", blurb: "Deploy, monitor, proxy and keep servers running.",
    keywords: ["devops", "kubernetes", "k8s", "docker", "container", "containers", "deploy", "deployment", "monitoring", "observability", "logging", "uptime", "terraform", "ansible", "proxy", "reverse proxy", "dns", "network", "networking", "web server", "cloud", "ci/cd", "paas"] },
  { slug: "web", name: "Web and frontend", blurb: "Browsers, site builders, CMSs and frontend tooling.",
    keywords: ["web", "browser", "frontend", "react", "css", "html", "javascript", "typescript", "static site", "static-site-generator", "cms", "website", "http", "extension"] },
  { slug: "data", name: "Data and databases", blurb: "Databases, analytics, notebooks and search engines.",
    keywords: ["database", "databases", "sql", "postgres", "postgresql", "sqlite", "analytics", "data", "visualization", "data-visualization", "etl", "notebook", "notebooks", "spreadsheet", "search engine", "duckdb", "olap"] },
  { slug: "media", name: "Photos, music and video", blurb: "Manage, stream and edit your own media.",
    keywords: ["photo", "photos", "image", "images", "video", "videos", "music", "audio", "media", "streaming", "podcast", "movie", "movies", "camera", "gallery", "ebook", "epub", "ffmpeg", "player"] },
  { slug: "privacy", name: "Privacy and security", blurb: "Passwords, encryption, ad blocking and keeping data yours.",
    keywords: ["privacy", "security", "encryption", "encrypted", "password", "passwords", "password-manager", "vpn", "adblock", "ad blocker", "tracker", "e2ee", "authentication", "firewall", "secrets", "tor", "wireguard", "yubikey", "2fa"] },
  { slug: "productivity", name: "Notes and productivity", blurb: "Notes, tasks, bookmarks, reading and writing.",
    keywords: ["note", "notes", "note-taking", "markdown", "todo", "tasks", "wiki", "knowledge", "knowledge-base", "pkm", "calendar", "bookmark", "bookmarks", "kanban", "read later", "rss", "email", "pdf", "writing", "obsidian", "productivity"] },
  { slug: "system", name: "OS and desktop", blurb: "Operating systems, desktops, file systems and backups.",
    keywords: ["linux", "macos", "windows", "desktop", "window manager", "window-manager", "wayland", "kde", "gnome", "kernel", "filesystem", "fuse", "operating system", "nixos", "nix", "freebsd", "backup", "backups", "package manager", "dotfiles"] },
  { slug: "languages", name: "Languages and libraries", blurb: "Compilers, runtimes and the libraries other tools are built on.",
    keywords: ["compiler", "compilers", "interpreter", "programming language", "programming-language", "runtime", "crate", "binding", "bindings", "jit", "wasm", "webassembly", "parser", "embedded", "microcontroller", "standard library", "type checker"] },
  { slug: "mobile", name: "Mobile", blurb: "Apps and tools for Android and iOS.",
    keywords: ["android", "ios", "iphone", "mobile", "f-droid"] },
  { slug: "games", name: "Games and fun", blurb: "Games, emulators and delightful toys.",
    keywords: ["game", "games", "gaming", "game engine", "game-engine", "retro gaming", "console emulator"] },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const findCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

type Classifiable = { name: string; description: string; topics: string[] };

export function categoriesOf(t: Classifiable): CategorySlug[] {
  const text = `${t.name} ${t.description} ${t.topics.join(" ")}`.toLowerCase();
  const words = new Set(text.split(/[^a-z0-9+#/-]+/).flatMap((w) => [w, ...w.split("-")]));
  const hit = (k: string) =>
    k.includes(" ") ? text.includes(k) : words.has(k) || (k.length >= 6 && [...words].some((w) => w.startsWith(k)));
  return CATEGORIES.filter((c) => c.keywords.some(hit)).map((c) => c.slug);
}
