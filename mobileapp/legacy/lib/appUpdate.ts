import { Capacitor } from "@capacitor/core";
import { AppUpdate, AppUpdateAvailability } from "@capawesome/capacitor-app-update";

export async function checkPlayStoreUpdate(): Promise<boolean> {
  if (Capacitor.getPlatform() !== "android") return false;
  try {
    const info = await AppUpdate.getAppUpdateInfo();
    return info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
  } catch {
    // Offline devices and installations outside Google Play must still open normally.
    return false;
  }
}

export async function openPlayStoreUpdate() {
  await AppUpdate.openAppStore();
}
