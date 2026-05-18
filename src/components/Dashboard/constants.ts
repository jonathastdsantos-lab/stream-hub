export type PlatformId = "youtube" | "twitch" | "kick" | "tiktok" | "facebook";

export const PLATFORMS: { id: PlatformId; label: string; color: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", color: "#FF0000", icon: "▶" },
  { id: "twitch", label: "Twitch", color: "#9146FF", icon: "⬡" },
  { id: "kick", label: "Kick", color: "#53FC18", icon: "◆" },
  { id: "tiktok", label: "TikTok", color: "#EE1D52", icon: "♪" },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "f" },
];

export const G = {
  bg: "#08080c",
  surface: "#111115",
  card: "#16161c",
  border: "#24242e",
  text: "#e8e8f2",
  muted: "#75758c",
  accent: "#00f0b5",
  live: "#ff3b3b",
  font: "'Syne', 'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

export const pColor = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)?.color ?? "#888";
