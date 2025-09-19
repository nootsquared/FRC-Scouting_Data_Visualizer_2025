/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: "rgb(var(--background-rgb))",
        foreground: "rgb(var(--foreground-rgb))",
        border: "rgb(209 213 219)",
        input: "rgb(209 213 219)",
        ring: "#2F5AA8",
        primary: {
          DEFAULT: "#2F5AA8",
          foreground: "rgb(255 255 255)",
        },
        brandBlue: {
          DEFAULT: "#1F3B73",
          muted: "#16294F",
          soft: "#264A8A",
          accent: "#2F5AA8",
        },
        secondary: {
          DEFAULT: "rgb(107 114 128)",
          foreground: "rgb(255 255 255)",
        },
        destructive: {
          DEFAULT: "rgb(239 68 68)",
          foreground: "rgb(255 255 255)",
        },
        muted: {
          DEFAULT: "rgb(243 244 246)",
          foreground: "rgb(107 114 128)",
        },
        accent: {
          DEFAULT: "rgb(243 244 246)",
          foreground: "rgb(17 24 39)",
        },
        popover: {
          DEFAULT: "rgb(255 255 255)",
          foreground: "rgb(17 24 39)",
        },
        card: {
          DEFAULT: "rgb(255 255 255)",
          foreground: "rgb(17 24 39)",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
} 
