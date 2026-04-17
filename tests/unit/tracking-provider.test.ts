import { resolveFormEventName } from "@/lib/tracking-events";

describe("resolveFormEventName", () => {
  it("returns stage3 trial event names", () => {
    expect(resolveFormEventName("trial", "started")).toBe("trial_form_started");
    expect(resolveFormEventName("trial", "submitted")).toBe("trial_form_submitted");
  });

  it("returns stage3 partner event names", () => {
    expect(resolveFormEventName("partner", "started")).toBe("partner_form_started");
    expect(resolveFormEventName("partner", "submitted")).toBe("partner_form_submitted");
  });

  it("keeps fallback names for unknown forms", () => {
    expect(resolveFormEventName("custom_form", "started")).toBe("form_start");
    expect(resolveFormEventName("custom_form", "submitted")).toBe("form_submit");
  });
});
