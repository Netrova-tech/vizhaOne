import { Sparkles } from "lucide-react";

/**
 * Render a category visual — shows image if available, falls back to icon or Sparkles
 */
export function CategoryIcon({
  icon,
  image,
  className = "h-6 w-6",
}: {
  icon?: string;
  image?: string;
  className?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt="category"
        className={`${className} object-cover rounded-lg`}
      />
    );
  }

  // Legacy fallback: if icon is an emoji or text, render as text
  if (icon && icon.length <= 4) {
    return <span className={className} style={{ fontSize: "inherit" }}>{icon}</span>;
  }

  // Default fallback
  return <Sparkles className={className} />;
}
