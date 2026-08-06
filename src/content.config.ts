import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const dailyDose = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/daily-dose",
  }),

  schema: z.object({
    title: z.string(),
    category: z.string(),
    meta: z.string(),
    image: z.string(),
    order: z.number().optional(),
  }),
});

export const collections = {
  "daily-dose": dailyDose,
};