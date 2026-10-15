import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zedu: {
          50: "#f5f1fd",
          100: "#eee7fb",
          600: "#4b20b8",
          700: "#3c169d",
        },
      },
      boxShadow: {
        panel: "0 3px 14px rgb(32 19 66 / 3%)",
      },
    },
  },
  plugins: [],
};

export default config;
