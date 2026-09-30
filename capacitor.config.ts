import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stocommandcenter.app',
  appName: 'STO Command Center',
  webDir: 'dist/client',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
};

export default config;
