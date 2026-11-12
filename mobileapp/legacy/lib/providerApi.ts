import { apiUrl } from "@/lib/utils";
import { token } from "@/lib/mobileAuth";

export async function providerRequest(path: string, body?: unknown) {
  const hasBody = body !== undefined;
  const response = await fetch(apiUrl(`/api/provider${path}`), {
    method: hasBody ? "PATCH" : "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
  const context = `Provider ${path} (HTTP ${response.status})`;
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${context}: the server returned an unreadable response. Please try again.`);
  }
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `${context}: request failed. Please try again.`);
  }
  if (!data || typeof data !== "object" ||
      (path === "/dashboard" && !Array.isArray(data.services)) ||
      (path === "/bookings" && !Array.isArray(data))) {
    throw new Error(`${context}: the server returned incomplete workspace data. Please try again.`);
  }
  return data;
}
