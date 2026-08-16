import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vizhaone.app",
  appName: "VizhaOne",
  webDir: "out",
  backgroundColor: "#fff7f8",
  android: { allowMixedContent: false },
  plugins: {
    CapacitorHttp: { enabled: true },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
};

export default config;
