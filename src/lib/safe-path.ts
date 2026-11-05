/** A redirect target taken from a form: a path on this site, or the fallback. "//host" and "/\\host" would leave the site. */
export const safePath = (value: unknown, fallback: string) => {
  const v = typeof value === "string" ? value : "";
  return /^\/(?![/\\])/.test(v) ? v : fallback;
};
