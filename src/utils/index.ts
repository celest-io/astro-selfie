import type { AstroGlobal } from "astro";

const stripTrailingSlash = (input: string): string => {
  return input.replace(/\/$/, "");
};

const selfiePath = (astro: AstroGlobal): string => {
  const pathname =
    astro.url.pathname === "/" ? "/index" : stripTrailingSlash(astro.url.pathname);

  return `/og${pathname}.png`;
};

export const selfieUrl = (astro: AstroGlobal): URL => {
  return new URL(selfiePath(astro), astro.site);
};
