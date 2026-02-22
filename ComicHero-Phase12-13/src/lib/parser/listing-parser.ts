import type { ParsedListingMeta } from "@/types/listing";

export function parseListingTitle(title: string): ParsedListingMeta {
  const normalized = title.trim();

  // Extract grading company + grade (e.g., "CGC 9.4", "CBCS 8.5")
  const gradeMatch = normalized.match(/\b(CGC|CBCS)\s+(\d{1,2}\.?\d?)\b/i);
  const gradingCompany = gradeMatch
    ? (gradeMatch[1].toUpperCase() as "CGC" | "CBCS")
    : null;
  const grade = gradeMatch ? parseFloat(gradeMatch[2]) : null;

  // Extract issue number with various patterns
  const issueMatch = normalized.match(
    /(?:#\s*|No\.?\s*|Issue\s+)(\d+[A-Za-z]?)\b/i
  );
  const issueNumber = issueMatch ? issueMatch[1] : extractStandaloneIssueNumber(normalized);

  // Extract series name (everything before the issue number)
  let seriesName: string | null = null;
  if (issueMatch && issueMatch.index !== undefined) {
    const beforeIssue = normalized.substring(0, issueMatch.index).trim();
    seriesName = cleanSeriesName(beforeIssue);
  } else if (issueNumber) {
    // Try to get series name before the standalone number
    const numIndex = normalized.indexOf(issueNumber);
    if (numIndex > 0) {
      seriesName = cleanSeriesName(normalized.substring(0, numIndex).trim());
    }
  }

  // Detect variant indicators
  const variantPatterns =
    /\b(variant|newsstand|direct edition|2nd print|3rd print|ratio|incentive|virgin|foil|sketch cover)\b/i;
  const variantMatch = normalized.match(variantPatterns);
  const isVariant = !!variantMatch;
  const variant = variantMatch ? variantMatch[0] : null;

  // Detect reprint/facsimile
  const isReprint = /\b(reprint|facsimile)\b/i.test(normalized);

  // Extract notable keywords
  const keywords: string[] = [];
  const keywordPatterns: RegExp[] = [
    /\b(?:1st|first)\s+(?:appearance|app\.?|print)\b/i,
    /\bwhite\s+pages\b/i,
    /\boff-white\b/i,
    /\b(?:signed|signature\s+series|ss)\b/i,
    /\b(?:key|hot|rare|htf)\b/i,
    /\b(NM|VF|FN|VG|GD|FR|PR)[+-]?\b/,
    /\b1st\s+\w+\b/i,
  ];
  for (const pattern of keywordPatterns) {
    const match = normalized.match(pattern);
    if (match) keywords.push(match[0]);
  }

  // Confidence score
  let confidence = 0.5;
  if (seriesName && issueNumber) confidence += 0.3;
  if (gradingCompany && grade) confidence += 0.15;
  if (isReprint) confidence -= 0.1;
  if (!seriesName && !issueNumber) confidence = 0.1;

  return {
    seriesName,
    issueNumber,
    grade,
    gradingCompany,
    isVariant,
    variant,
    isReprint,
    keywords,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

function cleanSeriesName(raw: string): string {
  let cleaned = raw
    .replace(/^(?:the|a)\s+/i, "")
    .replace(/\s+(?:comic|comics|book|books)$/i, "")
    .replace(/\s+vol\.?\s*\d+/i, "")
    .replace(/\s+\(\d{4}\)\s*/, " ")
    .replace(/[,;|]+$/, "")
    .trim();

  // Remove trailing numbers that look like years
  cleaned = cleaned.replace(/\s+\d{4}$/, "").trim();

  return cleaned || raw.trim();
}

function extractStandaloneIssueNumber(title: string): string | null {
  // Remove known non-issue numbers: years (4 digits), grades, prices
  const cleaned = title
    .replace(/\b\d{4}\b/g, "YEAR")
    .replace(/\b(?:CGC|CBCS)\s+\d+\.?\d*/gi, "GRADE")
    .replace(/\$\d+\.?\d*/g, "PRICE");

  // Look for a standalone 1-3 digit number
  const matches = cleaned.match(/\b(\d{1,3})\b/g);
  if (matches && matches.length === 1) return matches[0];
  return null;
}
