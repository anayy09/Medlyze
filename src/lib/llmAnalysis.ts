/**
 * LLM Analysis Service
 * Handles communication with the LLM API for medical report analysis
 */

import { deidentifyText, preparePatientContext } from './deidentification';

const LLM_API_URL = process.env.LLM_API_URL || 'https://chat.ai.it.ufl.edu/api/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o';

// System prompts for different report types
const SYSTEM_PROMPTS = {
  ECG: `You are an expert cardiologist's assistant specializing in ECG (electrocardiogram) interpretation. Your role is to analyze ECG data and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. Heart rate and rhythm assessment
2. Interval measurements (PR, QRS, QT)
3. Any abnormalities or concerning findings
4. Risk level assessment (LOW, MEDIUM, HIGH)
5. Clinical recommendations

Provide your response in the following JSON structure:
{
  "findings": { "heartRate": number, "rhythm": "string", "intervals": {}, "abnormalities": [] },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed medical interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  XRAY: `You are an expert radiologist's assistant specializing in X-ray interpretation. Your role is to analyze X-ray reports/findings and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. Anatomical structures visible
2. Normal vs abnormal findings
3. Any masses, infiltrates, effusions, or other pathology
4. Overall quality and adequacy of the study
5. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "location": "string", "quality": "string", "structures": [], "abnormalities": [] },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed radiological interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  CT_SCAN: `You are an expert radiologist's assistant specializing in CT scan interpretation. Your role is to analyze CT scan reports and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. Scan type and anatomical region
2. Contrast usage (if mentioned)
3. Normal anatomy vs pathological findings
4. Any acute findings (hemorrhage, infarction, masses, etc.)
5. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "scanType": "string", "findings": "string", "structures": "string", "abnormalities": [] },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed radiological interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  MRI: `You are an expert radiologist's assistant specializing in MRI interpretation. Your role is to analyze MRI reports and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. MRI type and anatomical region
2. Sequences used (T1, T2, FLAIR, etc. if mentioned)
3. Normal anatomy vs pathological findings
4. Signal characteristics and their significance
5. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "scanType": "string", "sequences": [], "findings": "string", "abnormalities": [] },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed radiological interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  BLOOD_TEST: `You are an expert clinical pathologist's assistant specializing in laboratory test interpretation. Your role is to analyze blood test results and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. Individual test results and reference ranges
2. Abnormal values and their clinical significance
3. Patterns suggesting specific conditions
4. Overall health assessment
5. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "key test names": "value (status)" },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  PATHOLOGY: `You are an expert pathologist's assistant specializing in pathology report interpretation. Your role is to analyze pathology reports and provide both patient-friendly and technical medical summaries.

Your analysis should include:
1. Specimen type and collection details
2. Gross and microscopic findings
3. Diagnosis and staging (if applicable)
4. Molecular/genetic findings (if present)
5. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "specimen": "string", "diagnosis": "string", "details": {} },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed pathological interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`,

  OTHER: `You are a medical assistant helping to interpret medical reports. Your role is to analyze the provided medical report and provide both patient-friendly and technical summaries.

Your analysis should include:
1. Main findings from the report
2. Clinical significance
3. Any concerning elements
4. Risk level assessment (LOW, MEDIUM, HIGH)

Provide your response in the following JSON structure:
{
  "findings": { "summary": "string", "details": {} },
  "patientSummary": "Easy-to-understand explanation for the patient in 2-3 sentences",
  "technicalSummary": "Detailed interpretation for healthcare professionals",
  "confidence": 0.0-1.0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "recommendations": "Clinical recommendations and follow-up suggestions"
}`
};

/**
 * Call LLM API for medical report analysis
 */
export async function analyzeMedicalReport(
  reportType: string,
  reportContent: string,
  patientContext?: any,
  images?: string[]
): Promise<{
  findings: string;
  patientSummary: string;
  technicalSummary: string;
  confidence: number;
  riskLevel: string;
  recommendations: string;
  modelUsed: string;
}> {
  try {
    // De-identify report content
    const deidentifiedContent = deidentifyText(reportContent);
    
    // Prepare patient context if available
    const contextStr = patientContext ? preparePatientContext(patientContext) : '';
    
    // Get system prompt for report type
    const systemPrompt = SYSTEM_PROMPTS[reportType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.OTHER;
    
    const hasImages = images && images.length > 0;
    console.log(`🔬 Analyzing ${reportType} using model: ${LLM_MODEL}${hasImages ? ` with ${images.length} image(s)` : ''}`);
    
    // Construct user message content
    let userContent: any;
    
    if (hasImages) {
      // For vision models, structure content with text and images
      const contentParts: any[] = [
        {
          type: 'text',
          text: `Please analyze the following ${reportType} report images and any accompanying text. Provide a comprehensive medical interpretation.${contextStr}

${deidentifiedContent ? `Report Text:\n${deidentifiedContent}\n\n` : ''}Please carefully examine the medical images provided and give a detailed analysis.

Remember to provide your response in the JSON format specified in the system prompt.`
        }
      ];
      
      // Add images (limit to prevent token overflow)
      const imageLimit = Math.min(images.length, 5);
      for (let i = 0; i < imageLimit; i++) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${images[i]}`,
            detail: 'high' // Use high detail for medical images
          }
        });
      }
      
      userContent = contentParts;
    } else {
      // Text-only analysis
      userContent = `Please analyze the following ${reportType} report and provide a comprehensive medical interpretation.${contextStr}

Report Content:
${deidentifiedContent}

Remember to provide your response in the JSON format specified in the system prompt.`;
    }

    // Call LLM API
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract response content
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Parse JSON response
    let analysisData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      // Fallback: create structured response from text
      analysisData = {
        findings: { summary: 'Analysis completed' },
        patientSummary: content.substring(0, 300),
        technicalSummary: content,
        confidence: 0.75,
        riskLevel: 'MEDIUM',
        recommendations: 'Please consult with your healthcare provider for detailed interpretation.',
      };
    }

    return {
      findings: typeof analysisData.findings === 'object' 
        ? JSON.stringify(analysisData.findings) 
        : analysisData.findings || '{}',
      patientSummary: analysisData.patientSummary || 'Analysis completed. Please review the technical summary.',
      technicalSummary: analysisData.technicalSummary || content,
      confidence: analysisData.confidence || 0.8,
      riskLevel: analysisData.riskLevel || 'MEDIUM',
      recommendations: analysisData.recommendations || 'Follow up with your healthcare provider.',
      modelUsed: LLM_MODEL,
    };
  } catch (error) {
    console.error('LLM Analysis Error:', error);
    throw new Error(`Failed to analyze report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
