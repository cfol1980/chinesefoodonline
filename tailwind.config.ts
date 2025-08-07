import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Include all App Router files
    './components/**/*.{js,ts,jsx,tsx}', // Include components if added later
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;