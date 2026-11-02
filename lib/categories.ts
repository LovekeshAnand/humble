// Browse categories, derived from each repo's GitHub topics.
export const CATEGORIES = [
  { slug: "self-hosted", name: "Self-hosted", topics: ["self-hosted", "selfhosted", "homelab", "home-server", "docker", "home-automation", "home-assistant"] },
  { slug: "media", name: "Media", topics: ["media", "video", "music", "audio", "photos", "photo", "photography", "streaming", "podcast", "image", "movies", "ebook", "ffmpeg"] },
  { slug: "privacy", name: "Privacy and security", topics: ["privacy", "security", "encryption", "password-manager", "vpn", "adblock", "e2ee", "authentication", "firewall", "wireguard", "tor"] },
  { slug: "dev", name: "Developer tools", topics: ["cli", "developer-tools", "devtools", "git", "terminal", "devops", "api", "testing", "debugging", "compiler", "editor", "vim", "neovim", "ide", "language-server", "lsp", "tui"] },
  { slug: "productivity", name: "Notes and productivity", topics: ["notes", "note-taking", "productivity", "markdown", "todo", "knowledge-base", "pkm", "calendar", "wiki", "obsidian", "kanban"] },
  { slug: "ai", name: "AI", topics: ["ai", "llm", "machine-learning", "deep-learning", "llama", "openai", "gpt", "rag", "agents", "ai-agents", "local-llm", "llms", "whisper", "speech-to-text"] },
  { slug: "data", name: "Data and databases", topics: ["database", "sql", "analytics", "data", "postgres", "postgresql", "sqlite", "visualization", "etl", "data-visualization"] },
  { slug: "web", name: "Web", topics: ["web", "browser", "frontend", "react", "css", "static-site-generator", "cms", "javascript", "typescript", "html"] },
  { slug: "system", name: "System and desktop", topics: ["linux", "macos", "windows", "desktop", "android", "ios", "window-manager", "shell", "system-monitor", "backup", "filesystem", "wayland", "kde", "gnome"] },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const categoriesOf = (topics: string[]) =>
  CATEGORIES.filter((c) => c.topics.some((t) => topics.includes(t))).map((c) => c.slug as CategorySlug);
