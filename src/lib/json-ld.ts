/** For <script type="application/ld+json">: "<" is escaped so text from a title or name can never close the tag and run as script. */
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
