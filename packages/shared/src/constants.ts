/** Daily sign-off a worker completes when clocking in. */
export const SAFETY_ITEMS = [
  { key: "ppe", label: "Hard hat, vest and boots on" },
  { key: "area", label: "Work area clear and marked" },
  { key: "ladders", label: "Ladders / scaffold secure" },
  { key: "tools", label: "Tools and cords inspected" },
  { key: "fit", label: "Fit for duty, no injuries" },
] as const;

export const INCIDENT_KINDS = [
  { key: "hazard", value: "Hazard" },
  { key: "nearMiss", value: "Near miss" },
  { key: "injury", value: "Injury" },
  { key: "propertyDamage", value: "Property damage" },
] as const;

/** Non-safety things the crew sends up from the field: questions, asks, progress photos. */
export const REQUEST_KINDS = [
  { key: "question", value: "Question" },
  { key: "materials", value: "Materials needed" },
  { key: "tool", value: "Tool / equipment request" },
  { key: "photos", value: "Progress photos" },
  { key: "other", value: "Other request" },
] as const;
