import type { CapacitorConfig } from "@capacitor/cli";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const config: CapacitorConfig = {
  appId: "com.vizhaone.app",
  appName: "VizhaOne",
  webDir: "out",
  backgroundColor: "#fff7f8",
  android: { allowMixedContent: false },
  plugins: {
    LiveUpdate: {
      publicKey: readFileSync(join(__dirname, "web-update-public.pem"), "utf8"),
      readyTimeout: 30000,
      autoBlockRolledBackBundles: true,
      autoDeleteBundles: true,
      autoUpdateStrategy: "none",
    },
    CapacitorHttp: { enabled: true },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: "#fff8f4",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
