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

  it("rejects non-email contact", () => {
    const parsed = trialFormSchema.safeParse({
      name: "Alice",
      contact: "wechat_id_123",
      japanese_level: "n3",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty contact", () => {
    const parsed = trialFormSchema.safeParse({
      name: "Alice",
      contact: "",
      japanese_level: "n3",
    });
    expect(parsed.success).toBe(false);
  });

  it("normalizes email to lowercase", () => {
    const parsed = trialFormSchema.safeParse({
      name: "Alice",
      contact: "Alice@Example.COM",
      japanese_level: "n3",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.contact).toBe("alice@example.com");
    }
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
