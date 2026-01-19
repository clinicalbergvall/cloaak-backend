import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: 'com.cleancloak.detailer',
  appName: 'CleanCloak Detailer',
  webDir: "dist",

  
  server: {
    
    allowNavigation: [
      "clean-cloak-b.onrender.com",
      "*.onrender.com",
      "*.netlify.app",
    ],

    
    androidScheme: "https",

    
    hostname: "localhost",
  },

  
  android: {
    
    allowMixedContent: true,

    
    webContentsDebuggingEnabled: false, 

    
    backgroundColor: "#000000",

    
    buildOptions: {
      
      releaseType: "APK",
    },
  },

  
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },

  
  plugins: {
    
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: "#000000", 
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#000000",
    },

    
    Keyboard: {
      resize: "native",
      style: "dark",
      resizeOnFullScreen: true,
    },

    
    StatusBar: {
      style: "dark",
      backgroundColor: "#FACC15",
    },

    
    App: {
      
    },

    
    CapacitorHttp: {
      enabled: true,
    },
  },

  
  loggingBehavior: "production", 
};

export default config;
