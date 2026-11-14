// theme.ts — single source of truth for every Remotion project.
// NEVER inline colors, easings, or spring configs in components.
import { Easing } from "remotion";

export const theme = {
  colors: {
    // Hindukush brand: navy #051449, orange from the logo mark, light #E4E4EA.
    bg: "#040B26",
    bgAlt: "#051449",
    primary: "#F5A000", // THE hero color — max one element per frame
    accent: "#3B5BDB",
    text: "#E4E4EA",
    textDim: "#9AA3C7",
    glow: "rgba(245, 160, 0, 0.45)",
  },
  fonts: {
    display: "Inter Variable", // load via @font-face + staticFile, or google-fonts
    body: "Inter Variable",
    mono: "JetBrains Mono",
  },
  // THE easing curves. Linear is forbidden.
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo — entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint — moves, Ken Burns
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // UI pops, words
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // big elements
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 }, // playful accents, logos
  },
} as const;
