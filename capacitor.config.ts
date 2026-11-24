import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.mangorema.app',
  appName: 'MANGOREMA',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#080B09',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DEFAULT',
    },
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false,
        },
      }
    : {
        server: {
          androidScheme: 'https',
        },
      }),
};

export default config;
