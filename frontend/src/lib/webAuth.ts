import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithPopup } from "firebase/auth";
import { apiUrl } from "@/lib/utils";

export type WebRole = "customer" | "service_provider" | "admin";
export interface WebAccount {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  location?: string;
  role: WebRole;
  provider?: "email" | "google";
  avatar_url?: string;
  created_at?: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcs35rXqtfm4CuOZO-NOLiTsdqLHbX-v4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vizhaone.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vizhaone",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:291050717643:web:vizhaone",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const SESSION_KEY = "vizha_demo_user";
const TOKEN_KEY = "vizha_mobile_token";

async function readJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "Unable to complete this request");
  return body;
}

export function saveWebSession(account: WebAccount, token?: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...account, mobile: account.mobile || account.phone }));
  window.dispatchEvent(new Event("vizha_auth_change"));
}

export async function loginWebAccount(email: string, password: string) {
  return readJson(await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })) as Promise<{ token?: string; user: WebAccount }>;
}

export async function registerWebAccount(profile: { name: string; email: string; password: string; phone: string; location: string; role: WebRole }) {
  return readJson(await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...profile, mobile: profile.phone }),
  })) as Promise<{ token: string; user: WebAccount }>;
}

export async function startGoogleWebSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(firebaseAuth, provider);
  const idToken = await credential.user.getIdToken(true);
  const body = await readJson(await fetch(apiUrl("/api/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  })) as { token?: string; user?: WebAccount; needsProfile: boolean; profile?: { name: string; email: string; avatar_url?: string } };
  return { ...body, idToken };
}

export async function completeGoogleWebProfile(idToken: string, profile: { name: string; phone: string; location: string; role: WebRole }) {
  return readJson(await fetch(apiUrl("/api/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...profile, mobile: profile.phone }),
  })) as Promise<{ token: string; user: WebAccount }>;
}

export async function sendWebPasswordReset(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email);
}
