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
