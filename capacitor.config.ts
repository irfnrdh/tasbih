import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.ruema.tasbih',
  appName: 'Tasbih',
  webDir: 'dist',
bundledWebRuntime: false,
plugins: {
  Haptics: {
    enable: true
  }
}
};

export default config;
