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
        brand: {
          50: "#fff0f3",
          100: "#ffe3e8",
          200: "#fecdd7",
          300: "#fda4b6",
          400: "#fb7091",
          500: "#f43f6c",
          600: "#e11d4d",
          700: "#be123e",
          800: "#9f1237",
          900: "#881333",
          primary: "#FF7B98",
          secondary: "#FFA8BA",
          dark: "#2A1820",
          soft: "#FFF5F7",
          peach: "#FFB5A7",
        },
      },
      fontFamily: {
        sans: ["Cairo", "Tajawal", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
