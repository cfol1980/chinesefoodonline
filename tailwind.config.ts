import type { Config } from 'tailwindcss';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}", // optional if using Tailwind in lib
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
