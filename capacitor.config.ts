import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jimmy.traceyourpath',
  appName: 'TraceOn',
  webDir: 'dist',
  plugins: {
    LocalNotifications: { iconColor: '#fbbf24', smallIcon: 'ic_stat_traceon' },
  },
  ios: { backgroundColor: '#111317' },
  android: { backgroundColor: '#111317' },
  backgroundColor: '#111317',
};

export default config;
