import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "SoftSpoken",
    description: "Read articles and selected webpage text aloud locally.",
    version: "0.1.0",
    permissions: ["activeTab", "storage", "scripting", "offscreen"],
    action: {
      default_title: "SoftSpoken",
    },
  },
  vite: () => ({
    build: {
      modulePreload: false,
    },
  }),
  modules: ["@wxt-dev/module-react"],
});
