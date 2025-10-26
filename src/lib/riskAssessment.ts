/**
 * Medical Risk Assessment & Stratification
 * Implements established clinical risk scores and models
 */

export interface RiskFactors {
  age: number;
  biologicalSex: 'MALE' | 'FEMALE';
  totalCholesterol?: number; // mg/dL
  hdlCholesterol?: number; // mg/dL
  ldlCholesterol?: number; // mg/dL
  systolicBP?: number; // mmHg
  diastolicBP?: number; // mmHg
  smokingStatus?: 'NEVER' | 'FORMER' | 'CURRENT';
  diabetesStatus?: boolean;
  hypertensionTreated?: boolean;
  familyHistoryCVD?: boolean;
  weight?: number; // kg
  height?: number; // cm
  waistCircumference?: number; // cm
  fastingGlucose?: number; // mg/dL
  hba1c?: number; // %
  triglycerides?: number; // mg/dL
}

export interface RiskAssessmentResult {
  score: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  percentageRisk?: number; // 10-year risk percentage
  factors: Record<string, any>;
  recommendations: string[];
  interpretation: string;
  validityPeriod: number; // days until reassessment needed
}

/**
 * Framingham Risk Score for 10-year CVD risk
 * Based on the 2008 Framingham General Cardiovascular Disease Risk Score
 */
export function calculateFraminghamRisk(factors: RiskFactors): RiskAssessmentResult {
  const { age, biologicalSex, totalCholesterol, hdlCholesterol, systolicBP, 
          smokingStatus, diabetesStatus, hypertensionTreated } = factors;

  // Check required parameters
  if (!age || !totalCholesterol || !hdlCholesterol || !systolicBP) {
    throw new Error('Missing required parameters for Framingham calculation');
  }

  let points = 0;
  const sex = biologicalSex === 'MALE' ? 'M' : 'F';

  // Age points
  if (sex === 'M') {
    if (age >= 30 && age <= 34) points += -1;
    else if (age >= 35 && age <= 39) points += 0;
    else if (age >= 40 && age <= 44) points += 1;
    else if (age >= 45 && age <= 49) points += 2;
    else if (age >= 50 && age <= 54) points += 3;
    else if (age >= 55 && age <= 59) points += 4;
    else if (age >= 60 && age <= 64) points += 5;
    else if (age >= 65 && age <= 69) points += 6;
    else if (age >= 70 && age <= 74) points += 7;
    else if (age >= 75) points += 8;
  } else {
    if (age >= 30 && age <= 34) points += -9;
    else if (age >= 35 && age <= 39) points += -4;
    else if (age >= 40 && age <= 44) points += 0;
    else if (age >= 45 && age <= 49) points += 3;
    else if (age >= 50 && age <= 54) points += 6;
    else if (age >= 55 && age <= 59) points += 7;
    else if (age >= 60 && age <= 64) points += 8;
    else if (age >= 65 && age <= 69) points += 9;
    else if (age >= 70 && age <= 74) points += 10;
    else if (age >= 75) points += 11;
  }

  // Total cholesterol points
  if (sex === 'M') {
    if (totalCholesterol < 160) points += -3;
    else if (totalCholesterol < 200) points += 0;
    else if (totalCholesterol < 240) points += 1;
    else if (totalCholesterol < 280) points += 2;
    else points += 3;
  } else {
    if (totalCholesterol < 160) points += -2;
    else if (totalCholesterol < 200) points += 0;
    else if (totalCholesterol < 240) points += 1;
    else if (totalCholesterol < 280) points += 2;
    else points += 3;
  }

  // HDL cholesterol points (same for both sexes)
  if (hdlCholesterol < 35) points += 2;
  else if (hdlCholesterol < 45) points += 1;
  else if (hdlCholesterol < 50) points += 0;
  else if (hdlCholesterol < 60) points += -1;
  else points += -2;

  // Blood pressure points
  if (hypertensionTreated) {
    if (systolicBP < 120) points += 0;
    else if (systolicBP < 130) points += 1;
    else if (systolicBP < 140) points += 2;
    else if (systolicBP < 160) points += 3;
    else points += 4;
  } else {
    if (systolicBP < 120) points += 0;
    else if (systolicBP < 130) points += 1;
    else if (systolicBP < 140) points += 1;
    else if (systolicBP < 160) points += 2;
    else points += 3;
  }

  // Smoking (5 points if current smoker)
  if (smokingStatus === 'CURRENT') points += 4;

  // Diabetes (3 points if diabetic)
  if (diabetesStatus) points += 3;

  // Convert points to 10-year risk percentage (simplified mapping)
  let riskPercentage = 0;
  let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' = 'LOW';

  if (points <= 0) {
    riskPercentage = 2;
    riskCategory = 'LOW';
  } else if (points <= 5) {
    riskPercentage = 3 + (points * 1.5);
    riskCategory = 'LOW';
  } else if (points <= 10) {
    riskPercentage = 10 + ((points - 5) * 2);
    riskCategory = 'MODERATE';
  } else if (points <= 15) {
    riskPercentage = 20 + ((points - 10) * 3);
    riskCategory = 'HIGH';
  } else {
    riskPercentage = 35 + ((points - 15) * 2);
    riskCategory = 'VERY_HIGH';
  }

  riskPercentage = Math.min(riskPercentage, 60); // Cap at 60%

  const recommendations = generateCVDRecommendations(riskCategory, factors);
  const interpretation = `Based on the Framingham Risk Score, you have a ${riskPercentage.toFixed(1)}% risk of developing cardiovascular disease in the next 10 years. This places you in the ${riskCategory.replace('_', ' ')} risk category.`;

  return {
    score: points,
    riskCategory,
    percentageRisk: riskPercentage,
    factors: {
      age,
      sex: biologicalSex,
      totalCholesterol,
      hdlCholesterol,
      systolicBP,
      smoking: smokingStatus,
      diabetes: diabetesStatus,
      hypertensionTreated,
    },
    recommendations,
    interpretation,
    validityPeriod: 365, // Reassess yearly
  };
}

/**
 * Calculate Type 2 Diabetes Risk Score
 * Based on ADA and CDC risk assessment guidelines
 */
export function calculateDiabetesRisk(factors: RiskFactors): RiskAssessmentResult {
  const { age, weight, height, waistCircumference, familyHistoryCVD, 
          fastingGlucose, hba1c, systolicBP } = factors;

  let points = 0;

  // Calculate BMI if height and weight available
  let bmi: number | undefined;
  if (height && weight) {
    const heightM = height / 100;
    bmi = weight / (heightM * heightM);
  }

  // Age points
  if (age && age >= 45) points += 2;
  else if (age && age >= 40) points += 1;

  // BMI points
  if (bmi) {
    if (bmi >= 30) points += 3;
    else if (bmi >= 25) points += 2;
  }

  // Waist circumference (indicator of central obesity)
  if (waistCircumference) {
    const threshold = factors.biologicalSex === 'MALE' ? 102 : 88; // cm
    if (waistCircumference >= threshold) points += 2;
  }

  // Family history
  if (familyHistoryCVD) points += 2;

  // Hypertension
  if (systolicBP && systolicBP >= 140) points += 2;

  // Prediabetes indicators
  if (fastingGlucose && fastingGlucose >= 100 && fastingGlucose < 126) points += 3;
  if (hba1c && hba1c >= 5.7 && hba1c < 6.5) points += 3;

  // Determine risk category
  let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  let percentageRisk: number;

  if (points <= 2) {
    riskCategory = 'LOW';
    percentageRisk = 5;
  } else if (points <= 5) {
    riskCategory = 'MODERATE';
    percentageRisk = 15;
  } else if (points <= 8) {
    riskCategory = 'HIGH';
    percentageRisk = 30;
  } else {
    riskCategory = 'VERY_HIGH';
    percentageRisk = 50;
  }

  const recommendations = generateDiabetesRecommendations(riskCategory, factors);
  const interpretation = `Your Type 2 Diabetes risk assessment indicates ${riskCategory.replace('_', ' ')} risk (approximately ${percentageRisk}% likelihood). ${points >= 5 ? 'Consider screening for prediabetes or diabetes.' : 'Continue healthy lifestyle practices.'}`;

  return {
    score: points,
    riskCategory,
    percentageRisk,
    factors: { age, bmi, waistCircumference, familyHistory: familyHistoryCVD, fastingGlucose, hba1c, systolicBP },
    recommendations,
    interpretation,
    validityPeriod: 365,
  };
}

/**
 * Generate personalized recommendations for CVD risk
 */
function generateCVDRecommendations(
  riskCategory: string,
  factors: RiskFactors
): string[] {
  const recommendations: string[] = [];

  if (factors.smokingStatus === 'CURRENT') {
    recommendations.push('🚭 Smoking cessation is the single most important step to reduce cardiovascular risk');
  }

  if (factors.systolicBP && factors.systolicBP >= 140) {
    recommendations.push('💊 Work with your doctor to manage high blood pressure through medication and lifestyle changes');
  }

  if (factors.totalCholesterol && factors.totalCholesterol >= 240) {
    recommendations.push('🥗 Consider dietary changes and possibly statin therapy to lower cholesterol');
  }

  if (factors.diabetesStatus) {
    recommendations.push('🩺 Maintain tight glycemic control through diet, exercise, and medication as prescribed');
  }

  // Universal recommendations
  recommendations.push('🏃 Aim for 150 minutes of moderate-intensity aerobic exercise per week');
  recommendations.push('🥦 Follow a heart-healthy diet (Mediterranean or DASH diet)');
  
  if (riskCategory === 'HIGH' || riskCategory === 'VERY_HIGH') {
    recommendations.push('⚕️ Schedule regular follow-ups with your cardiologist');
    recommendations.push('💊 Discuss aspirin therapy and statin use with your doctor');
  }

  return recommendations;
}

/**
 * Generate personalized recommendations for diabetes risk
 */
function generateDiabetesRecommendations(
  riskCategory: string,
  factors: RiskFactors
): string[] {
  const recommendations: string[] = [];

  if (factors.weight && factors.height) {
    const heightM = factors.height / 100;
    const bmi = factors.weight / (heightM * heightM);
    
    if (bmi >= 25) {
      const targetWeightLoss = Math.round(factors.weight * 0.07); // 7% weight loss goal
      recommendations.push(`🎯 Aim to lose ${targetWeightLoss} kg (7% of body weight) through diet and exercise`);
    }
  }

  recommendations.push('🥗 Adopt a low-glycemic index diet rich in vegetables, whole grains, and lean protein');
  recommendations.push('🏃 Engage in at least 150 minutes of moderate physical activity per week');
  
  if (factors.fastingGlucose && factors.fastingGlucose >= 100) {
    recommendations.push('🩺 Request a glucose tolerance test or HbA1c screening from your doctor');
  }

  if (riskCategory === 'HIGH' || riskCategory === 'VERY_HIGH') {
    recommendations.push('💊 Discuss metformin therapy or a diabetes prevention program with your doctor');
    recommendations.push('📊 Monitor blood glucose levels regularly');
  }

  return recommendations;
}

/**
 * Calculate comprehensive risk profile
 */
export async function calculateComprehensiveRiskProfile(
  factors: RiskFactors
): Promise<{
  framingham?: RiskAssessmentResult;
  diabetes?: RiskAssessmentResult;
  overallHealthScore: number;
}> {
  const results: any = {
    overallHealthScore: 100, // Start with perfect score
  };

  // Try to calculate Framingham if we have the data
  try {
    if (factors.totalCholesterol && factors.hdlCholesterol && factors.systolicBP) {
      results.framingham = calculateFraminghamRisk(factors);
      // Reduce health score based on CVD risk
      if (results.framingham.riskCategory === 'HIGH') results.overallHealthScore -= 20;
      else if (results.framingham.riskCategory === 'VERY_HIGH') results.overallHealthScore -= 35;
      else if (results.framingham.riskCategory === 'MODERATE') results.overallHealthScore -= 10;
    }
  } catch (error) {
    console.log('Could not calculate Framingham risk:', error);
  }

  // Try to calculate diabetes risk
  try {
    if (factors.age && (factors.weight || factors.fastingGlucose)) {
      results.diabetes = calculateDiabetesRisk(factors);
      // Reduce health score based on diabetes risk
      if (results.diabetes.riskCategory === 'HIGH') results.overallHealthScore -= 15;
      else if (results.diabetes.riskCategory === 'VERY_HIGH') results.overallHealthScore -= 25;
      else if (results.diabetes.riskCategory === 'MODERATE') results.overallHealthScore -= 8;
    }
  } catch (error) {
    console.log('Could not calculate diabetes risk:', error);
  }

  // Adjust for lifestyle factors
  if (factors.smokingStatus === 'CURRENT') results.overallHealthScore -= 15;
  if (factors.smokingStatus === 'FORMER') results.overallHealthScore -= 5;

  // Ensure score is between 0 and 100
  results.overallHealthScore = Math.max(0, Math.min(100, results.overallHealthScore));

  return results;
}
