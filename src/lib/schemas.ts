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
