import { partnerFormSchema, trialFormSchema } from "@/lib/schemas";

describe("trialFormSchema", () => {
  it("accepts a valid minimal payload", () => {
    const parsed = trialFormSchema.safeParse({
      name: "Alice",
      contact: "alice@example.com",
      japanese_level: "n3",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.willing_followup).toBe(true);
    }
  });

  it("rejects payload without required fields", () => {
    const parsed = trialFormSchema.safeParse({
      current_status: "looking",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("partnerFormSchema", () => {
  it("accepts valid required fields", () => {
    const parsed = partnerFormSchema.safeParse({
      org_name: "Kibou",
      contact_person: "Bob",
      contact_method: "bob@kibou.com",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing contact method", () => {
    const parsed = partnerFormSchema.safeParse({
      org_name: "Kibou",
      contact_person: "Bob",
    });
    expect(parsed.success).toBe(false);
  });
});
