import "server-only";
import { cookies, draftMode } from "next/headers";

/** Cookie set by /admin/preview?images=1: shows hidden developer images, only while an admin's draft preview is on. */
export const PREVIEW_IMAGES_COOKIE = "mn_preview_images";

export interface PreviewView { drafts: boolean; hiddenImages: boolean }

/**
 * What this visitor may see: drafts and hidden developer images only in an admin's draft preview. Cookies are read only
 * when draft mode is on, so public pages stay static.
 */
export async function previewView(): Promise<PreviewView> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return { drafts: false, hiddenImages: false };
  return { drafts: true, hiddenImages: (await cookies()).get(PREVIEW_IMAGES_COOKIE)?.value === "1" };
}
