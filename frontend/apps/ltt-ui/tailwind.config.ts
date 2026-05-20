/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0b5394", dark: "#073763", light: "#e7f0f9" },
        accent: "#cc0000",
        success: "#137333",
        warning: "#b45309",
        muted: "#5f6368",
        "vd-bg": "#f4f6fa",
        "vd-card": "#ffffff",
        "vd-head": "#eef3f9",
        "row-alt": "#fafcfe",
        "vd-border": "#d7dbe0",
      },
      fontFamily: {
        sans: [
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["12px", { lineHeight: "1.4" }],
        md: ["12.5px", { lineHeight: "1.4" }],
        base: ["13px", { lineHeight: "1.4" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,20,25,.04)",
        modal: "0 10px 40px rgba(0,0,0,.25)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
