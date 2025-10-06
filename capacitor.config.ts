import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.808c9e1474e54037b5a045e850c57b1d',
  appName: 'trace-your-path-vibe',
  webDir: 'dist',
  server: {
    url: 'https://808c9e14-74e5-4037-b5a0-45e850c57b1d.lovableproject.com',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#fbbf24",
      sound: "beep.wav"
    }
  },
  ios: {
    allowsLinkPreview: false,
    scrollEnabled: false,
    backgroundColor: '#000000',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;