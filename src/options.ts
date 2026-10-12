export type Options = {
  screen?: {
    width: number;
    height: number;
  };
  viewport?: {
    width: number;
    height: number;
  };
  outputDir?: string;
};

/** Options passed to the runtime helpers through the virtual module. */
export type ResolvedOptions = Required<Options> & { base: string };
