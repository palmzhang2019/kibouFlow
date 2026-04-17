export function resolveFormEventName(formType: string, phase: "started" | "submitted") {
  if (formType === "trial" || formType === "partner") {
    return `${formType}_form_${phase}`;
  }
  return phase === "started" ? "form_start" : "form_submit";
}
