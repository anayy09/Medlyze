/**
 * De-identification Utility
 * Masks or strips potential PII from medical text data before sending to external LLM
 */

// Common PII patterns to detect and mask
const PII_PATTERNS = [
  // Names (common patterns)
  { pattern: /\b(patient|doctor|dr\.?|mr\.?|mrs\.?|ms\.?|miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, replacement: '$1 [REDACTED]' },
  
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  
  // Phone numbers (various formats)
  { pattern: /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  
  // Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  
  // Addresses (simplified - catches "Street", "Ave", "Road", etc.)
  { pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi, replacement: '[ADDRESS_REDACTED]' },
  
  // Dates with identifiable specificity (full dates like MM/DD/YYYY or Month DD, YYYY)
  // Keep year-only or age references
  { pattern: /\b(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])[-/]\d{4}\b/g, replacement: '[DATE_REDACTED]' },
  { pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, replacement: '[DATE_REDACTED]' },
  
  // Medical Record Numbers (MRN) - common patterns
  { pattern: /\b(?:MRN|Medical Record|Record Number|Patient ID|ID)[:=#\s]*([A-Z0-9-]+)\b/gi, replacement: 'MRN: [REDACTED]' },
  
  // Account/Insurance numbers
  { pattern: /\b(?:Account|Insurance|Policy)\s*(?:Number|#|No\.?)[:=#\s]*([A-Z0-9-]+)\b/gi, replacement: '$1 Number: [REDACTED]' },
];

/**
 * De-identify text by masking potential PII
 * @param text - Raw text that may contain PII
 * @returns De-identified text with PII masked
 */
export function deidentifyText(text: string): string {
  if (!text) return text;
  
  let deidentifiedText = text;
  
  // Apply all PII masking patterns
  for (const { pattern, replacement } of PII_PATTERNS) {
    deidentifiedText = deidentifiedText.replace(pattern, replacement);
  }
  
  return deidentifiedText;
}

/**
 * Prepare patient context for LLM analysis
 * Includes de-identified demographics and medical history
 * @param patientProfile - Patient profile data
 * @returns Sanitized patient context string
 */
export function preparePatientContext(patientProfile: {
  age?: number | null;
  biologicalSex?: string | null;
  weight?: number | null;
  height?: number | null;
  bloodType?: string | null;
  allergies?: string | null;
  medications?: string | null;
  medicalHistory?: string | null;
  chronicIllness?: string | null;
  surgeries?: string | null;
  familyHistory?: string | null;
}): string {
  const contextParts: string[] = [];
  
  // Basic demographics (no PII)
  if (patientProfile.age) {
    contextParts.push(`Age: ${patientProfile.age} years`);
  }
  
  if (patientProfile.biologicalSex) {
    contextParts.push(`Biological Sex: ${patientProfile.biologicalSex}`);
  }
  
  if (patientProfile.weight && patientProfile.height) {
    const bmi = (patientProfile.weight / ((patientProfile.height / 100) ** 2)).toFixed(1);
    contextParts.push(`Weight: ${patientProfile.weight}kg, Height: ${patientProfile.height}cm (BMI: ${bmi})`);
  } else if (patientProfile.weight) {
    contextParts.push(`Weight: ${patientProfile.weight}kg`);
  } else if (patientProfile.height) {
    contextParts.push(`Height: ${patientProfile.height}cm`);
  }
  
  if (patientProfile.bloodType) {
    contextParts.push(`Blood Type: ${patientProfile.bloodType}`);
  }
  
  // Medical information (de-identify text fields)
  if (patientProfile.allergies) {
    contextParts.push(`Allergies: ${deidentifyText(patientProfile.allergies)}`);
  }
  
  if (patientProfile.medications) {
    contextParts.push(`Current Medications: ${deidentifyText(patientProfile.medications)}`);
  }
  
  if (patientProfile.medicalHistory) {
    contextParts.push(`Medical History: ${deidentifyText(patientProfile.medicalHistory)}`);
  }
  
  if (patientProfile.chronicIllness) {
    contextParts.push(`Chronic Illnesses: ${deidentifyText(patientProfile.chronicIllness)}`);
  }
  
  if (patientProfile.surgeries) {
    contextParts.push(`Previous Surgeries: ${deidentifyText(patientProfile.surgeries)}`);
  }
  
  if (patientProfile.familyHistory) {
    contextParts.push(`Family History: ${deidentifyText(patientProfile.familyHistory)}`);
  }
  
  return contextParts.length > 0 
    ? `\n\nPatient Context:\n${contextParts.join('\n')}` 
    : '';
}

/**
 * Validate that no obvious PII remains in text
 * @param text - Text to validate
 * @returns true if text appears safe, false if potential PII detected
 */
export function validateDeidentification(text: string): boolean {
  // Check for common PII indicators that should have been removed
  const dangerousPatterns = [
    /@[A-Za-z0-9.-]+\./,  // Email domain
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, // Phone format
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      console.warn('⚠️ Potential PII detected in text after de-identification');
      return false;
    }
  }
  
  return true;
}
