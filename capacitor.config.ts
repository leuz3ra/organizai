import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.leonardo.organizai',
  appName: 'OrganizAi',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: true
    }
  }
};

export default config;
