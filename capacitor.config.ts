import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New package id lets this test build install alongside the old APK.
  appId: "com.stocommandcenter.mobile",
  appName: "STO Command Center",
  webDir: ".output/public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
};

export default config;
