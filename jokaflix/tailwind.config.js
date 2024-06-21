/** @type {import('tailwindcss').Config} */
const flowbite = require("flowbite-react/tailwind");
module.exports = {
  content: ["./src/**/*.{html,js,jsx}",flowbite.content(),],
  theme: {
    extend: {},
  },
  plugins: [require("tw-elements-react/dist/plugin.cjs"),flowbite.plugin(),],
}

