import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.traceyourpath',
  appName: 'TRACE',
  webDir: 'dist',
  plugins: {
    LocalNotifications: { iconColor: '#fbbf24' },
  },
  ios: { backgroundColor: '#000000' },
};

export default config;
