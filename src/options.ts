import { z } from "astro/zod";

export const optionsSchema = z
  .object({
    /**
     * Options for the screenshot functionality.
     */
    screen: z
      .object({
        width: z.number().default(1024),
        height: z.number().default(768),
      })
      .optional(),

    /**
     * Options for the viewport functionality.
     */
    viewport: z
      .object({
        width: z.number().default(1024),
        height: z.number().default(768),
      })
      .optional(),
    outputDir: z.string().default("og"),
  })
  .optional();

export type Options = z.infer<typeof optionsSchema>;
