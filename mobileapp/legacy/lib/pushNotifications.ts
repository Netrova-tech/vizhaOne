import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { apiUrl } from "@/lib/utils";

const PREFERENCE = "vizha_push_enabled";
const DEVICE_TOKEN = "vizha_push_token";
const supported = () => Capacitor.getPlatform() === "android";
const authToken = () => localStorage.getItem("vizha_mobile_token");
let listeners: Promise<void> | undefined;
let registration: Promise<void> | undefined;
let complete: (() => void) | undefined;
let fail: ((error: Error) => void) | undefined;

export function pushEnabled() { return localStorage.getItem(PREFERENCE) === "true"; }
export function pushSupported() { return supported(); }
function changed() { window.dispatchEvent(new Event("vizha_push_change")); }
async function updateDevice(method: "POST" | "DELETE", deviceToken: string) {
  const jwt = authToken();
  if (!jwt) throw new Error("Sign in to enable notifications");
  const response = await fetch(apiUrl("/api/notifications/devices"), {
    method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ token: deviceToken, platform: "android" }),
  });
  if (!response.ok) throw new Error("Could not save notification settings. Please retry.");
}
function openRoute(value: unknown) {
  // Only app-owned routes may be opened by remote notification data.
  if (typeof value === "string" && /^\/(bookings|profile|provider-dashboard|planner)(\?.*)?$/.test(value)) {
    window.location.hash = `#${value}`;
  }
}
async function attachListeners() {
  if (!listeners) listeners = (async () => {
    await PushNotifications.addListener("registration", device => {
      if (!authToken() || !pushEnabled()) return;
      localStorage.setItem(DEVICE_TOKEN, device.value);
      void updateDevice("POST", device.value).then(() => { complete?.(); changed(); }).catch(error => fail?.(error));
    });
    await PushNotifications.addListener("registrationError", () => {
      fail?.(new Error("Notification registration failed. Please retry."));
    });
    await PushNotifications.addListener("pushNotificationReceived", notification => {
      if (authToken() && pushEnabled()) toast(notification.title || "VizhaOne", {
        description: notification.body,
        action: { label: "View", onClick: () => openRoute(notification.data?.route) },
      });
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", event => {
      if (authToken() && pushEnabled()) openRoute(event.notification.data?.route);
    });
  })();
  return listeners;
}
async function register() {
  if (registration) return registration;
  registration = (async () => {
    await attachListeners();
    await PushNotifications.createChannel({ id: "vizhaone_updates", name: "Booking updates", description: "Updates about your bookings", importance: 4, sound: "default" });
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("Notification setup timed out. Please retry.")), 15000);
      complete = () => { window.clearTimeout(timer); resolve(); };
      fail = error => { window.clearTimeout(timer); reject(error); };
      void PushNotifications.register().catch(error => fail?.(error));
    });
  })().finally(() => { registration = undefined; complete = undefined; fail = undefined; });
  return registration;
}
export async function enablePush() {
  if (!supported()) throw new Error("Push notifications are available in the Android app");
  if (!authToken()) throw new Error("Sign in to enable notifications");
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("Allow notifications in Android Settings to receive booking updates");
  localStorage.setItem(PREFERENCE, "true");
  try { await register(); }
  catch (error) {
    localStorage.setItem(PREFERENCE, "false");
    changed();
    await unregisterPushDevice().catch(() => undefined);
    throw error;
  }
  changed();
}
export async function unregisterPushDevice() {
  if (!supported()) return;
  localStorage.setItem(PREFERENCE, "false");
  changed();
  const deviceToken = localStorage.getItem(DEVICE_TOKEN);
  try { if (deviceToken && authToken()) await updateDevice("DELETE", deviceToken); }
  finally {
    // Invalidate FCM locally even when the server is unreachable during logout.
    await PushNotifications.unregister();
    localStorage.removeItem(DEVICE_TOKEN);
    await PushNotifications.removeAllDeliveredNotifications();
  }
}
export async function disablePush() {
  localStorage.setItem(PREFERENCE, "false");
  changed();
  await unregisterPushDevice();
}
export async function restorePush() {
  if (!supported() || !authToken() || !pushEnabled()) return;
  const permission = await PushNotifications.checkPermissions();
  if (permission.receive === "granted") await register();
  else { localStorage.setItem(PREFERENCE, "false"); changed(); await unregisterPushDevice(); }
}
