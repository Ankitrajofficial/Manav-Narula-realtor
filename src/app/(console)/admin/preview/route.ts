import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PREVIEW_IMAGES_COOKIE } from "@/lib/preview";

/**
 * Admin preview for this browser only, then opens `to` (site paths only):
 *   (no flags)   drafts become visible on the website
 *   ?images=1    also show developer images that are hidden on the live site; ?images=0 hides them again
 *   ?off=1       leave preview
 * The "Show developer images" switch of each project is not changed.
 */
export async function GET(request: Request) {
  await requireUser("admin");
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "/projects";
  const draft = await draftMode();
  const jar = await cookies();
  if (url.searchParams.get("off")) {
    draft.disable();
    jar.delete(PREVIEW_IMAGES_COOKIE);
  } else {
    draft.enable();
    const images = url.searchParams.get("images");
    if (images === "1") jar.set(PREVIEW_IMAGES_COOKIE, "1", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 8 });
    if (images === "0") jar.delete(PREVIEW_IMAGES_COOKIE);
  }
  redirect(to.startsWith("/") && !to.startsWith("//") ? to : "/projects");
}
