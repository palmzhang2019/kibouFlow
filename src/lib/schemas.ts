import { z } from "zod";

export const trialFormSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  current_status: z.string().optional(),
  main_concern: z.string().optional(),
  goal: z.string().optional(),
  willing_followup: z.boolean().default(true),
  source_note: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer: z.string().optional(),
  landing_page: z.string().optional(),
  locale: z.string().optional(),
});

export type TrialFormData = z.infer<typeof trialFormSchema>;

export const partnerFormSchema = z.object({
  org_name: z.string().min(1),
  contact_person: z.string().min(1),
  contact_method: z.string().min(1),
  org_type: z.string().optional(),
  cooperation_interest: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer: z.string().optional(),
  landing_page: z.string().optional(),
  locale: z.string().optional(),
});

export type PartnerFormData = z.infer<typeof partnerFormSchema>;

const localeSchema = z.enum(["zh", "ja"]);

export const geoSiteSettingsSchema = z.object({
  site_name: z.string().trim().min(1).max(120),
  default_title_template: z.string().trim().min(1).max(120),
  default_description: z.string().trim().min(1).max(300),
  default_locale: localeSchema,
  site_url: z.url().startsWith("https://"),
  robots_policy: z.string().trim().max(200).optional(),
});

export const geoPageSettingsSchema = z.object({
  locale: localeSchema,
  path: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((value) => {
      const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
      return withLeadingSlash.replace(/\/{2,}/g, "/");
    }),
  meta_title: z.string().trim().min(1).max(120).optional(),
  meta_description: z.string().trim().min(1).max(300).optional(),
  canonical_url: z.url().startsWith("https://").optional(),
  og_title: z.string().trim().min(1).max(120).optional(),
  og_description: z.string().trim().min(1).max(300).optional(),
  og_image: z.url().startsWith("https://").optional(),
  noindex: z.boolean().optional().default(false),
  jsonld_overrides: z.record(z.string(), z.unknown()).optional(),
});

export type GeoSiteSettingsInput = z.infer<typeof geoSiteSettingsSchema>;
export type GeoPageSettingsInput = z.infer<typeof geoPageSettingsSchema>;

const regexStringSchema = z
  .string()
  .trim()
  .min(1)
  .superRefine((value, ctx) => {
    try {
      new RegExp(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid regex pattern",
      });
    }
  });

export const geoRulesSchema = z.object({
  locale: localeSchema,
  faq_exclude_heading_patterns: z.array(regexStringSchema).optional().default([]),
  faq_min_items: z.number().int().min(1).max(20).default(2),
  howto_section_patterns: z.array(regexStringSchema).optional().default([]),
  howto_min_steps: z.number().int().min(1).max(20).default(2),
  article_abstract_from_tldr: z.boolean().default(false),
});

export const geoSchemaTogglesSchema = z.object({
  locale: localeSchema,
  path: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((value) => {
      const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
      return withLeadingSlash.replace(/\/{2,}/g, "/");
    }),
  enable_article: z.boolean().optional().default(true),
  enable_faqpage: z.boolean().optional().default(true),
  enable_howto: z.boolean().optional().default(true),
  enable_breadcrumb: z.boolean().optional().default(true),
  enable_website: z.boolean().optional().default(true),
});

export const geoRulesPreviewSchema = z.object({
  locale: localeSchema,
  markdown: z.string().min(1),
  ruleOverrides: geoRulesSchema.partial().optional(),
});

export const geoRulesRollbackSchema = z.object({
  log_id: z.string().uuid(),
});

export type GeoRulesInput = z.infer<typeof geoRulesSchema>;
export type GeoSchemaTogglesInput = z.infer<typeof geoSchemaTogglesSchema>;

export const geoRoleSchema = z.enum(["admin", "editor", "reviewer"]);

export const geoRoleBindingSchema = z.object({
  user_id: z.string().trim().min(1),
  role: geoRoleSchema,
});

export const geoPublishRequestSchema = z.object({
  scope: z.enum(["site", "page", "rules", "toggles"]),
  locale: localeSchema,
  path: z.string().trim().optional(),
  draft_json: z.record(z.string(), z.unknown()),
  status: z.enum(["draft", "pending"]).default("draft"),
});

export const geoPublishReviewSchema = z.object({
  status: z.enum(["published", "rejected"]),
  review_comment: z.string().trim().max(500).optional(),
});

export const geoPublishActionSchema = z.object({
  emergency: z.boolean().optional().default(false),
  reason: z.string().trim().max(500).optional(),
});
