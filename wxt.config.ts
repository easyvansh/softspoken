import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "SoftSpoken",
    description: "Read articles and selected webpage text aloud locally.",
    permissions: ["activeTab", "storage", "scripting", "offscreen"],
    action: {
      default_title: "SoftSpoken",
    },
  },
  modules: ["@wxt-dev/module-react"],
});
