export type OccasionType =
  | "Love"
  | "Apology"
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
    id: "Perfect",
    name: "Perfect — Ed Sheeran",
    tracks: [
      { id: "perfect_sine", title: "Dreamy Plucks", description: "Soft acoustic melody" },
      { id: "perfect_retro", title: "Retro Ambient", description: "Lo-fi synth rhythm" },
    ],
  },
  {
    id: "AllOfMe",
    name: "All of Me — John Legend",
    tracks: [
      { id: "allofme_sine", title: "Piano Plucks", description: "Warm emotional chords" },
      { id: "allofme_retro", title: "Mellow Synth", description: "Vintage ambient chord pattern" },
    ],
  },
  {
    id: "CantHelp",
    name: "Can't Help Falling in Love — Elvis Presley",
    tracks: [
      { id: "canthelp_sine", title: "Classic Plucks", description: "Romantic soft vibe" },
      { id: "canthelp_retro", title: "Vintage Warmth", description: "Lyrical vintage keys" },
    ],
  },
  {
    id: "ThousandYears",
    name: "A Thousand Years — Christina Perri",
    tracks: [
      { id: "thousand_sine", title: "Celestial Arpeggio", description: "Dreamy modern tempo" },
      { id: "thousand_retro", title: "Cozy Chimes", description: "Retro bell atmosphere" },
    ],
  },
  {
    id: "JustTheWay",
    name: "Just the Way You Are — Bruno Mars",
    tracks: [
      { id: "justtheway_sine", title: "Happy Plucks", description: "Lively, upbeat tone" },
      { id: "justtheway_retro", title: "Retro Chords", description: "Playful retro wave" },
    ],
  },
  {
    id: "FeelMyLove",
    name: "Make You Feel My Love — Adele",
    tracks: [
      { id: "feelmylove_sine", title: "Tender Lofi", description: "Warm, slow progression" },
      { id: "feelmylove_retro", title: "Retro Twilight", description: "Soft analog chords" },
    ],
  },
  {
    id: "ThinkingOutLoud",
    name: "Thinking Out Loud — Ed Sheeran",
    tracks: [
      { id: "thinking_sine", title: "Soulful Plucks", description: "Ethereal acoustic arpeggios" },
      { id: "thinking_retro", title: "Cozy Vintage", description: "Warm analog rhythm" },
    ],
  },
  {
    id: "UntilIFoundYou",
    name: "Until I Found You — Stephen Sanchez",
    tracks: [
      { id: "until_sine", title: "Dreamy Ballad", description: "Slow 50s-style plucks" },
      { id: "until_retro", title: "Vintage Cassette", description: "Atmospheric detuned synth" },
    ],
  },
  {
    id: "LOVE",
    name: "L-O-V-E — Nat King Cole",
    tracks: [
      { id: "love_sine", title: "Upbeat Swing", description: "Bright and cheerful plucks" },
      { id: "love_retro", title: "Jazzy Chimes", description: "Vintage glockenspiel chords" },
    ],
  },
  {
    id: "AtLast",
    name: "At Last — Etta James",
    tracks: [
      { id: "atlast_sine", title: "Ethereal Blues", description: "Rich, slow background harmonies" },
      { id: "atlast_retro", title: "Soft Organ", description: "Vintage warm ambient synth" },
    ],
  },
];

export const OCCASIONS: OccasionType[] = [
  "Love",
  "Apology",
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

export interface AnalyticsEvent {
  id: string;
  eventType: "gift_created" | "gift_opened" | "gift_shared";
  giftId: string;
  createdAt: string;
  recipientName?: string;
  senderName?: string;
  occasion?: string;
  flowerType?: string;
}

export interface AdminMetricsData {
  metrics: {
    totalGifts: number;
    openedGifts: number;
    topFlower: string;
    topOccasion: string;
    voiceNotesSent: number;
  };
  events: AnalyticsEvent[];
  gifts: Gift[];
  databaseStatus: {
    isSupabaseConfigured: boolean;
    loadedFromSupabase: boolean;
  };
}

