import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export async function shareContent(options: { title: string; text: string; url?: string }) {
  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title: options.title,
      text: options.text,
      url: options.url,
      dialogTitle: `Share ${options.title}`,
    });
    return "shared" as const;
  }

  if (navigator.share) {
    await navigator.share(options);
    return "shared" as const;
  }

  await navigator.clipboard.writeText(options.url || options.text);
  return "copied" as const;
}
