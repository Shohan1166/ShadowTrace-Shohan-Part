import { z } from "zod";
import MonitoredAccount from "../models/MonitoredAccount.js";
import ExposureRecord from "../models/ExposureRecord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashEmail, maskEmail, normalizeEmail } from "../utils/privacy.js";
import { calculateExposureRisk, buildRecommendations } from "../utils/riskEngine.js";
import { logActivity } from "../utils/activityLogger.js";

const addAccountSchema = z.object({
  email: z.string().trim().email().max(254),
  label: z.string().trim().max(60).optional().or(z.literal(""))
});

export const listMonitoredAccounts = asyncHandler(async (req, res) => {
  const accounts = await MonitoredAccount.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("emailMasked label lastScannedAt exposureCount createdAt");
  res.json({ accounts });
});

export const addMonitoredAccount = asyncHandler(async (req, res) => {
  const parsed = addAccountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a valid email address.", errors: parsed.error.flatten() });

  const normalized = normalizeEmail(parsed.data.email);
  const emailHash = hashEmail(normalized);
  const existing = await MonitoredAccount.findOne({ user: req.user._id, emailHash }).select("_id");
  if (existing) return res.status(409).json({ message: "This email is already being monitored." });

  const account = await MonitoredAccount.create({
    user: req.user._id,
    emailHash,
    emailMasked: maskEmail(normalized),
    label: parsed.data.label || "Personal account"
  });
  await logActivity(req, { action: "MONITORED_ACCOUNT_ADDED", category: "Monitoring", description: `Added ${maskEmail(normalized)} for exposure monitoring.` });
  res.status(201).json({ message: "Account added for exposure monitoring.", account: {
    _id: account._id, emailMasked: account.emailMasked, label: account.label,
    lastScannedAt: account.lastScannedAt, exposureCount: account.exposureCount, createdAt: account.createdAt
  }});
});

export const removeMonitoredAccount = asyncHandler(async (req, res) => {
  const deleted = await MonitoredAccount.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) return res.status(404).json({ message: "Monitored account not found." });
  await logActivity(req, { action: "MONITORED_ACCOUNT_REMOVED", category: "Monitoring", description: "Removed a monitored account." });
  res.json({ message: "Monitored account removed." });
});

export const scanMonitoredAccount = asyncHandler(async (req, res) => {
  const account = await MonitoredAccount.findOne({ _id: req.params.id, user: req.user._id }).select("+emailHash emailMasked label");
  if (!account) return res.status(404).json({ message: "Monitored account not found." });

  // This prototype searches only the local academic/synthetic dataset. It does not crawl the dark web.
  const records = await ExposureRecord.find({ emailHash: account.emailHash })
    .sort({ breachDate: -1, createdAt: -1 })
    .select("sourceName breachDate exposedDataTypes severity description datasetVersion isSynthetic createdAt");

  const risk = calculateExposureRisk(records);
  const recommendations = buildRecommendations(records, risk);

  account.lastScannedAt = new Date();
  account.exposureCount = records.length;
  await account.save();
  await logActivity(req, { action: "EXPOSURE_ANALYSIS_COMPLETED", category: "Monitoring", description: `Exposure analysis completed with ${records.length} dataset match(es).`, severity: risk.level === "Critical" ? "Critical" : risk.level === "High" ? "High" : "Info", metadata: { matches: records.length, riskScore: risk.score, riskLevel: risk.level } });

  res.json({
    message: "Exposure analysis completed against the available simulated dataset.",
    dataset: "Local academic demo dataset",
    account: { id: account._id, emailMasked: account.emailMasked, label: account.label },
    summary: { exposureCount: records.length, scannedAt: account.lastScannedAt, riskScore: risk.score, riskLevel: risk.level, riskFactors: risk.factors },
    recommendations,
    exposures: records.map((record) => ({
      id: record._id,
      sourceName: record.sourceName,
      breachDate: record.breachDate,
      exposedDataTypes: record.exposedDataTypes,
      severity: record.severity,
      description: record.description,
      datasetVersion: record.datasetVersion,
      synthetic: record.isSynthetic
    }))
  });
});
