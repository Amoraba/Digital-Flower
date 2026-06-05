export type OccasionType =
  | "Love"
  | "Birthday"
  | "Congratulations"
  | "Thank You"
  | "Thinking of You"
  | "Get Well Soon"
  | "Custom";

export type FlowerType =
  | "Rose"
  | "Tulip"
  | "Sunflower"
  | "Orchid"
  | "Daisy"
  | "Lotus"
  | "Cherry Blossom"
  | "Mixed Bouquet";

export type ColorType =
  | "Red"
  | "Pink"
  | "White"
  | "Yellow"
  | "Blue"
  | "Purple"
  | "Orange";

export interface MusicCategory {
  id: string;
  name: string;
  tracks: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export interface Gift {
  id?: string;
  occasion: OccasionType;
  flowerType: FlowerType;
  flowerColor: ColorType;
  recipientName: string;
  senderName?: string;
  personalMessage: string;
  voiceNoteBase64?: string; // Stored voice note base64 Data URL
  musicCategory: string;
  musicTrack: string;
  createdAt?: string;
  status?: "pending" | "paid";
  paymentMethod?: string;
}

// Color palettes for the flower renderer based on color selection
export const FLOWER_COLORS: Record<ColorType, { primary: string; secondary: string; glow: string }> = {
  Red: { primary: "#ef4444", secondary: "#991b1b", glow: "rgba(239, 68, 68, 0.4)" },
  Pink: { primary: "#ec4899", secondary: "#9d174d", glow: "rgba(236, 72, 153, 0.4)" },
  White: { primary: "#f8fafc", secondary: "#cbd5e1", glow: "rgba(248, 250, 252, 0.4)" },
  Yellow: { primary: "#eab308", secondary: "#854d0e", glow: "rgba(234, 179, 8, 0.4)" },
  Blue: { primary: "#3b82f6", secondary: "#1e3a8a", glow: "rgba(59, 130, 246, 0.4)" },
  Purple: { primary: "#a855f7", secondary: "#581c87", glow: "rgba(168, 85, 247, 0.4)" },
  Orange: { primary: "#f97316", secondary: "#9a3412", glow: "rgba(249, 115, 22, 0.4)" },
};

// Curated internal music options metadata
export const MUSIC_LIBRARY: MusicCategory[] = [
  {
    id: "FurElise",
    name: "Für Elise",
    tracks: [
      { id: "beethoven_sine", title: "Pure Sine Bloom", description: "Lyrical ambient tone" },
      { id: "beethoven_retro", title: "Retro Triangle", description: "Soft vintage arpeggiation" },
    ],
  },
  {
    id: "CanonInD",
    name: "Canon in D",
    tracks: [
      { id: "pachelbel_sine", title: "Dreamy Plucks", description: "Warm, universally loved harmony" },
      { id: "pachelbel_retro", title: "Soft Glockenspiel", description: "Chippy celebratory bells" },
    ],
  },
  {
    id: "MinuetInG",
    name: "Minuet in G",
    tracks: [
      { id: "bach_sine", title: "Baroque Flute", description: "Bright and cheerful Counterpoint" },
      { id: "bach_retro", title: "Chamber Music", description: "Upbeat vintage chords" },
    ],
  },
  {
    id: "EineKleine",
    name: "Nachtmusik",
    tracks: [
      { id: "mozart_sine", title: "Mozart Serenade", description: "Lively and sparkling symphonic tune" },
      { id: "mozart_retro", title: "Symphonic Waves", description: "Bright triangle wave rocket" },
    ],
  },
  {
    id: "ClairDeLune",
    name: "Clair de Lune",
    tracks: [
      { id: "debussy_sine", title: "Serene Moonrise", description: "Slow, peaceful impressionist space" },
      { id: "debussy_retro", title: "Atmospheric Pads", description: "Ethereal soothing waves" },
    ],
  },
];

export const OCCASIONS: OccasionType[] = [
  "Love",
  "Birthday",
  "Congratulations",
  "Thank You",
  "Thinking of You",
  "Get Well Soon",
  "Custom",
];

export const FLOWERS: FlowerType[] = [
  "Rose",
  "Tulip",
  "Sunflower",
  "Orchid",
  "Daisy",
  "Lotus",
  "Cherry Blossom",
  "Mixed Bouquet",
];

export const COLORS: ColorType[] = ["Red", "Pink", "White", "Yellow", "Blue", "Purple", "Orange"];
