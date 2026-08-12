import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vizhaone.app",
  appName: "VizhaOne",
  webDir: "out",
  backgroundColor: "#fff7f8",
  android: { allowMixedContent: true },
  plugins: {
    CapacitorHttp: { enabled: true },
  },
};

export default config;
