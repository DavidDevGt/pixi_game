import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.josue.pixigame",
  appName: "Pixi Game",
  webDir: "dist",
  backgroundColor: "#0e1116",
  server: {
    androidScheme: "https",
  },
};

export default config;
