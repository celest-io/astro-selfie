import config from "virtual:@celestio/astro-selfie/config";

import { screenshotName, screenshotPath, stripBase } from "../paths.js";

/**
 * The subset of `Astro` that `selfieUrl` reads. Structural so that pages
 * typed with their own `Props` stay assignable.
 */
export type SelfieAstro = {
  url: URL;
  site: URL | undefined;
};

export const selfieUrl = (astro: SelfieAstro): URL => {
  const name = screenshotName(stripBase(astro.url.pathname, config.base));
  return new URL(screenshotPath(name, config.outputDir, config.base), astro.site);
};
