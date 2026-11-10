import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";
import { apiUrl } from "@/lib/utils";

let checking = false;
let lastCheck = 0;

// Run only after React has mounted. Native rollback remains active if boot fails.
export async function markWebUpdateReady() {
  if (Capacitor.getPlatform() === "android") await LiveUpdate.ready();
}

export async function checkWebUpdate() {
  if (Capacitor.getPlatform() !== "android" || checking || (lastCheck && Date.now() - lastCheck < 15 * 60 * 1000)) return;
  checking = true;
  lastCheck = Date.now();
  try {
    const { build } = await App.getInfo();
    const base = process.env.NEXT_PUBLIC_WEB_UPDATE_URL || apiUrl("/api/web-updates");
    const response = await fetch(`${base.replace(/\/$/, "")}/${encodeURIComponent(build)}/latest.json`, {
      cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const release = await response.json();
    if (!release || release.nativeBuild !== build ||
        typeof release.bundleId !== "string" || !/^android-\d+-[a-f0-9]{24}$/.test(release.bundleId) ||
        typeof release.url !== "string" || new URL(release.url).protocol !== "https:" ||
        typeof release.checksum !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(release.checksum) ||
        typeof release.signature !== "string" || !release.signature) return;
    const [current, next, blocked, downloaded] = await Promise.all([
      LiveUpdate.getCurrentBundle(), LiveUpdate.getNextBundle(),
      LiveUpdate.getBlockedBundles(), LiveUpdate.getDownloadedBundles(),
    ]);
    if (current.bundleId === release.bundleId || next.bundleId === release.bundleId || blocked.bundleIds.includes(release.bundleId)) return;
    if (!downloaded.bundleIds.includes(release.bundleId)) {
      await LiveUpdate.downloadBundle({ bundleId: release.bundleId, url: release.url, artifactType: "zip", checksum: release.checksum, signature: release.signature });
    }
    // Never reload during a booking or profile edit. Native startup applies this.
    await LiveUpdate.setNextBundle({ bundleId: release.bundleId });
  } catch {
    // Offline, invalid manifests and rejected signatures keep the installed app usable.
  } finally {
    checking = false;
  }
}
