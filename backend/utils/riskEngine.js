const TYPE_WEIGHTS = {
  "password": 30,
  "password hash": 22,
  "email": 8,
  "phone": 8,
  "full name": 5,
  "address": 8,
  "date of birth": 8,
  "payment data": 18,
  "security answers": 15,
  "session token": 25,
  "api key": 25
};
const SEVERITY_WEIGHTS = { Low: 8, Medium: 18, High: 28, Critical: 38 };

export function calculateExposureRisk(records = []) {
  if (!records.length) return { score: 0, level: "No known match", factors: [] };
  const types = [...new Set(records.flatMap((record) => record.exposedDataTypes || []))];
  const typeScore = Math.min(45, types.reduce((sum, type) => sum + (TYPE_WEIGHTS[String(type).toLowerCase()] || 4), 0));
  const severityScore = Math.max(...records.map((record) => SEVERITY_WEIGHTS[record.severity] || 8));
  const volumeScore = Math.min(17, (records.length - 1) * 5);
  const score = Math.min(100, typeScore + severityScore + volumeScore);
  const level = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score, level, factors: [`${records.length} matching dataset record(s)`, ...types.map((type) => `Exposed data type: ${type}`)] };
}

export function buildRecommendations(records = [], risk = calculateExposureRisk(records)) {
  if (!records.length) return [
    { priority: "Routine", title: "Keep monitoring enabled", detail: "No matching record was found in the current academic dataset. This is not proof that the account has never been exposed." },
    { priority: "Routine", title: "Use unique passwords", detail: "Use a different strong password for each service and enable multi-factor authentication where available." }
  ];
  const types = new Set(records.flatMap((record) => record.exposedDataTypes || []).map((type) => String(type).toLowerCase()));
  const recommendations = [
    { priority: "High", title: "Change affected account passwords", detail: "Update passwords on the affected service and any other service where the same password may have been reused." },
    { priority: "High", title: "Enable multi-factor authentication", detail: "Add an authenticator app, passkey, or another supported second factor to important accounts." }
  ];
  if (types.has("password") || types.has("password hash")) recommendations.push({ priority: "High", title: "Review password reuse", detail: "Prioritize accounts that shared the same password. Do not send passwords to ShadowTrace or any monitoring service." });
  if (types.has("session token")) recommendations.push({ priority: "High", title: "Sign out other sessions", detail: "Use the affected service's security settings to revoke active sessions and review trusted devices." });
  if (types.has("payment data")) recommendations.push({ priority: "High", title: "Review payment activity", detail: "Check recent transactions and contact the payment provider through its official channel if anything is unfamiliar." });
  recommendations.push({ priority: risk.level === "Critical" || risk.level === "High" ? "High" : "Medium", title: "Check account recovery settings", detail: "Review recovery email addresses, phone numbers, connected apps, and recent sign-in activity." });
  return recommendations;
}
