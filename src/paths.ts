const trimSlashes = (input: string): string => input.replace(/^\/+|\/+$/g, "");

/**
 * Maps a page pathname to its screenshot name, so the build (Astro's `pages`)
 * and the runtime (`Astro.url.pathname`) agree whatever `build.format` and
 * `trailingSlash` are: "", "/", "index.html" → "index"; "about", "/about/",
 * "/about.html", "about/index.html" → "about".
 */
export const screenshotName = (pathname: string): string => {
  const name = trimSlashes(pathname)
    .replace(/\.html$/, "")
    .replace(/(^|\/)index$/, "");
  return name === "" ? "index" : name;
};

/** Removes Astro's `base` from a pathname that includes it. */
export const stripBase = (pathname: string, base: string): string => {
  const prefix = `/${trimSlashes(base)}`;
  if (prefix === "/") return pathname;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || "/";
  }
  return pathname;
};

/** URL path of a screenshot, relative to the site root (includes `base`). */
export const screenshotPath = (name: string, outputDir: string, base: string): string => {
  return `/${[trimSlashes(base), trimSlashes(outputDir), `${name}.png`].filter(Boolean).join("/")}`;
};
