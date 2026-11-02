"use client";
import {
  BrainIcon, BrowserIcon, CloudIcon, CodeIcon, CubeIcon, DatabaseIcon, DeviceMobileIcon, DesktopIcon,
  FilmStripIcon, GameControllerIcon, HardDrivesIcon, NotePencilIcon, ShieldCheckIcon, TerminalWindowIcon,
  type Icon,
} from "@phosphor-icons/react";

const ICONS: Record<string, Icon> = {
  ai: BrainIcon,
  "self-hosted": HardDrivesIcon,
  cli: TerminalWindowIcon,
  dev: CodeIcon,
  infra: CloudIcon,
  web: BrowserIcon,
  data: DatabaseIcon,
  media: FilmStripIcon,
  privacy: ShieldCheckIcon,
  productivity: NotePencilIcon,
  system: DesktopIcon,
  languages: CubeIcon,
  mobile: DeviceMobileIcon,
  games: GameControllerIcon,
};

export default function CategoryIcon({ slug, size = 20 }: { slug: string; size?: number }) {
  const I = ICONS[slug] ?? CubeIcon;
  return <I size={size} aria-hidden="true" />;
}
