import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "pop-left": "popLeft 0.5s ease-out forwards",
        "pop-right": "popRight 0.5s ease-out forwards",
        fall: "fall linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
