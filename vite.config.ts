import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  base: "/turtlebot-visualizer/",
  optimizeDeps: {
    include: ["roslib"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /roslib/],
      transformMixedEsModules: true,
      defaultIsModuleExports: "auto",
    },
  },
});
