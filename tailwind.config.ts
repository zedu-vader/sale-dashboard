import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    // Keep the reset off so adding Tailwind doesn't restyle pages that don't use it yet.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#4c1d95", hover: "#5b21b6", soft: "#ede9fe" },
        ink: "#17132b",
        muted: "#6b6785",
        line: "#ece9f5",
        canvas: "#f7f6fb",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};

export default config;
