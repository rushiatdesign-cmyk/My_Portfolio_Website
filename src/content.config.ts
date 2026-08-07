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

/** Shared base schema for all content-card collections */
const contentCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishDate: z.coerce.date(),
  image: z.string(),
  tags: z.array(z.string()).default([]),
  /** Placeholder — swap with live fetch (Supabase/Firebase/KV) without touching the UI */
  views: z.number().default(0),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: contentCardSchema,
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: contentCardSchema.extend({
    role: z.string().optional(),
    client: z.string().optional(),
    year: z.number().optional(),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/gallery" }),
  schema: contentCardSchema.extend({
    medium: z.string().optional(),
    dimensions: z.string().optional(),
  }),
});

const stuff = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/stuff" }),
  schema: contentCardSchema.extend({
    link: z.string().url().optional(),
    type: z.enum(["tool", "article", "resource", "inspiration", "other"]).default("other"),
  }),
});

export const collections = {
  "daily-dose": dailyDose,
  blog,
  work,
  gallery,
  stuff,
};