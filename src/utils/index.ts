import config from "virtual:@celestio/astro-selfie/config";

/**
 * The subset of `Astro` that `selfieUrl` reads. Structural so that pages
 * typed with their own `Props` stay assignable.
 */
export type SelfieAstro = {
  url: URL;
  site: URL | undefined;
};

const stripTrailingSlash = (input: string): string => {
  return input.replace(/\/$/, "");
};

const selfiePath = (astro: SelfieAstro): string => {
  const pathname =
    astro.url.pathname === "/" ? "/index" : stripTrailingSlash(astro.url.pathname);

  const outputDir = stripTrailingSlash(config?.outputDir);
  return `/${outputDir}${pathname}.png`;
};

export const selfieUrl = (astro: SelfieAstro): URL => {
  return new URL(selfiePath(astro), astro.site);
};
