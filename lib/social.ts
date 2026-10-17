/**
 * The one place the brand's social profiles live. The footer icons, the Organization sameAs array
 * and the Instagram section all read from here, so a changed handle is a one-line edit.
 */
import type { Locale } from "./i18n";

export type SocialId = "facebook" | "instagram" | "x" | "youtube";

export type SocialLink = {
  id: SocialId;
  name: string;
  url: string;
  /** aria-label and tooltip, per language */
  label: Record<Locale, string>;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "facebook",
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61595476320684",
    label: { en: "AwadhLand on Facebook", hi: "फ़ेसबुक पर AwadhLand" },
  },
  {
    id: "instagram",
    name: "Instagram",
    url: "https://www.instagram.com/awadhland/",
    label: { en: "AwadhLand on Instagram", hi: "इंस्टाग्राम पर AwadhLand" },
  },
  {
    id: "x",
    name: "X",
    url: "https://x.com/AwadhLand",
    label: { en: "AwadhLand on X", hi: "X पर AwadhLand" },
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com/@AwadhLand",
    label: { en: "AwadhLand on YouTube", hi: "यूट्यूब पर AwadhLand" },
  },
];

export const INSTAGRAM_URL = SOCIAL_LINKS.find((s) => s.id === "instagram")!.url;
export const INSTAGRAM_HANDLE = "@awadhland";

/** Profile URLs for schema.org sameAs. */
export const SOCIAL_URLS = SOCIAL_LINKS.map((s) => s.url);
