import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // PATIENT 1: Michael Rodriguez - High Cholesterol, Active Health Management
  // ============================================================================
  const patient1Password = await bcrypt.hash('demo123', 10);
  const patient1 = await prisma.user.upsert({
    where: { email: 'michael.rodriguez@demo.com' },
    update: {},
    create: {
      email: 'michael.rodriguez@demo.com',
      name: 'Michael Rodriguez',
      password: patient1Password,
      role: 'PATIENT',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created patient 1:', patient1.email);

  const patient1Profile = await prisma.patientProfile.upsert({
    where: { userId: patient1.id },
    update: {},
    create: {
      userId: patient1.id,
      age: 52,
      biologicalSex: 'Male',
      weight: 88.5,
      height: 175,
      bloodType: 'O+',
      allergies: 'Shellfish',
      medications: 'Atorvastatin 20mg daily, Aspirin 81mg daily',
      medicalHistory: 'High cholesterol diagnosed 2023, Borderline hypertension',
      chronicIllness: 'Hyperlipidemia',
      familyHistory: 'Father: MI at age 58, Mother: Stroke at 65, Brother: Type 2 Diabetes',
      smokingStatus: 'FORMER',
      diabetesStatus: false,
      healthScore: 68.0,
      riskScores: {
        framingham: 10,
        framinghamRisk: 22.5,
        lastUpdated: new Date().toISOString(),
      },
    },
  });
  console.log('✓ Created patient 1 profile with risk data');

  // Patient 1 - Blood Test Report
  const p1Report1 = await prisma.medicalReport.create({
    data: {
      userId: patient1.id,
      title: 'Lipid Panel - 6 Month Follow-up',
      description: 'Follow-up lipid panel after starting statin therapy',
      reportType: 'BLOOD_TEST',
      fileUrl: 'p1-lipid-oct2025',
      fileName: 'lipid-panel-2025-10.pdf',
      fileSize: 156234,
      mimeType: 'application/pdf',
      status: 'ANALYZED',
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: p1Report1.id,
      analysisType: 'BLOOD_TEST_ANALYSIS',
      findings: JSON.stringify({
        cholesterol: { total: 195, hdl: 48, ldl: 115, triglycerides: 160 },
        glucose: 98,
      }),
      patientSummary: 'Your cholesterol levels have improved significantly! Total cholesterol is now 195 mg/dL (down from 240), and LDL is 115 mg/dL (down from 165). Your statin medication is working well. Keep up the great work with diet and exercise!',
      technicalSummary: 'Lipid panel shows therapeutic response to atorvastatin. Total cholesterol 195 mg/dL, LDL 115 mg/dL, HDL 48 mg/dL (borderline low), triglycerides 160 mg/dL (borderline high). Fasting glucose 98 mg/dL (normal). Continue current therapy. Consider lifestyle modifications to raise HDL.',
      confidence: 0.92,
      riskLevel: 'MODERATE',
      recommendations: 'Continue statin therapy. Increase aerobic exercise to raise HDL. Consider omega-3 supplementation for triglycerides. Repeat lipid panel in 6 months.',
      modelUsed: 'gpt-5',
      biomarkers: {
        cholesterol_total: 195,
        cholesterol_hdl: 48,
        cholesterol_ldl: 115,
        triglycerides: 160,
        glucose_fasting: 98,
      },
      educationalLinks: JSON.stringify([
        { title: 'Cholesterol: What You Need to Know', url: 'https://www.heart.org/en/health-topics/cholesterol', source: 'AHA', type: 'ARTICLE', trustScore: 10 },
      ]),
    },
  });

  // Patient 1 - Biomarker Trends
  await prisma.biomarkerTrend.createMany({
    data: [
      { userId: patient1.id, biomarkerType: 'cholesterol_total', value: 240, unit: 'mg/dL', recordedDate: new Date('2025-04-15'), reportId: p1Report1.id },
      { userId: patient1.id, biomarkerType: 'cholesterol_total', value: 195, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p1Report1.id },
      { userId: patient1.id, biomarkerType: 'cholesterol_ldl', value: 165, unit: 'mg/dL', recordedDate: new Date('2025-04-15') },
      { userId: patient1.id, biomarkerType: 'cholesterol_ldl', value: 115, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p1Report1.id },
      { userId: patient1.id, biomarkerType: 'cholesterol_hdl', value: 42, unit: 'mg/dL', recordedDate: new Date('2025-04-15') },
      { userId: patient1.id, biomarkerType: 'cholesterol_hdl', value: 48, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p1Report1.id },
    ],
  });
  console.log('✓ Created biomarker trends for patient 1');

  // Patient 1 - Health Goals
  const p1Goal1 = await prisma.healthGoal.create({
    data: {
      patientProfileId: patient1Profile.id,
      title: 'Lower LDL Cholesterol to Target',
      description: 'Reduce LDL cholesterol from 165 to below 100 mg/dL',
      targetMetric: 'cholesterol_ldl',
      currentValue: 165,
      targetValue: 100,
      unit: 'mg/dL',
      targetDate: new Date('2026-04-15'),
      status: 'IN_PROGRESS',
      createdBy: patient1.id,
    },
  });

  await prisma.goalProgress.createMany({
    data: [
      { goalId: p1Goal1.id, value: 165, notes: 'Baseline measurement', recordedAt: new Date('2025-04-15') },
      { goalId: p1Goal1.id, value: 115, notes: 'After 6 months on statin + Mediterranean diet', recordedAt: new Date('2025-10-20') },
    ],
  });
  console.log('✓ Created health goals for patient 1');

  // Patient 1 - Risk Assessment
  await prisma.riskAssessment.create({
    data: {
      userId: patient1.id,
      assessmentType: 'FRAMINGHAM_CVD',
      score: 10,
      riskCategory: 'MODERATE',
      riskPercentage: 22.5,
      factors: { age: 52, sex: 'Male', totalCholesterol: 195, hdlCholesterol: 48, systolicBP: 135, smoking: 'FORMER' },
      recommendations: '🏃 Aim for 150 minutes of moderate exercise per week\n🥦 Continue Mediterranean diet\n💊 Maintain statin therapy\n🩺 Monitor blood pressure regularly',
      validUntil: new Date('2026-10-25'),
    },
  });

  // ============================================================================
  // PATIENT 2: Priya Patel - Prediabetic, Weight Management Journey
  // ============================================================================
  const patient2Password = await bcrypt.hash('demo123', 10);
  const patient2 = await prisma.user.upsert({
    where: { email: 'priya.patel@demo.com' },
    update: {},
    create: {
      email: 'priya.patel@demo.com',
      name: 'Priya Patel',
      password: patient2Password,
      role: 'PATIENT',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created patient 2:', patient2.email);

  const patient2Profile = await prisma.patientProfile.upsert({
    where: { userId: patient2.id },
    update: {},
    create: {
      userId: patient2.id,
      age: 38,
      biologicalSex: 'Female',
      weight: 82.0,
      height: 162,
      bloodType: 'A+',
      allergies: 'None known',
      medications: 'Metformin 500mg twice daily, Multivitamin',
      medicalHistory: 'Prediabetes diagnosed 2024, PCOS, Gestational diabetes during pregnancy (2020)',
      chronicIllness: 'Prediabetes, PCOS',
      familyHistory: 'Mother: Type 2 Diabetes, Father: Hypertension, Maternal Grandmother: Type 2 Diabetes',
      smokingStatus: 'NEVER',
      diabetesStatus: false,
      healthScore: 62.0,
      riskScores: {
        diabetes: 8,
        diabetesRisk: 40,
        lastUpdated: new Date().toISOString(),
      },
    },
  });
  console.log('✓ Created patient 2 profile with diabetes risk');

  // Patient 2 - HbA1c Test
  const p2Report1 = await prisma.medicalReport.create({
    data: {
      userId: patient2.id,
      title: 'HbA1c and Glucose Monitoring',
      description: '3-month diabetes prevention program checkup',
      reportType: 'BLOOD_TEST',
      fileUrl: 'p2-hba1c-oct2025',
      fileName: 'diabetes-screening-2025-10.pdf',
      fileSize: 124567,
      mimeType: 'application/pdf',
      status: 'ANALYZED',
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: p2Report1.id,
      analysisType: 'BLOOD_TEST_ANALYSIS',
      findings: JSON.stringify({
        glucose: 104,
        hba1c: 5.8,
        insulin: 18,
      }),
      patientSummary: 'Your HbA1c is 5.8%, which is still in the prediabetes range but has improved from 6.1%! Your fasting glucose is 104 mg/dL (slightly elevated). Your efforts with diet, exercise, and metformin are paying off. Keep going—you\'re on the right track to prevent diabetes!',
      technicalSummary: 'HbA1c 5.8% (prediabetes range, improved from 6.1%). Fasting glucose 104 mg/dL (impaired fasting glucose). Fasting insulin 18 μU/mL (suggests mild insulin resistance). Patient has lost 6kg since starting diabetes prevention program. Continue metformin 500mg BID, lifestyle modifications. Repeat HbA1c in 3 months.',
      confidence: 0.94,
      riskLevel: 'MODERATE',
      recommendations: 'Excellent progress! Continue current treatment plan. Target: lose additional 4-5 kg. Aim for 150+ minutes weekly exercise. Low glycemic diet. Consider continuous glucose monitor.',
      modelUsed: 'gpt-5',
      biomarkers: {
        glucose_fasting: 104,
        hba1c: 5.8,
      },
      educationalLinks: JSON.stringify([
        { title: 'Preventing Type 2 Diabetes', url: 'https://www.cdc.gov/diabetes/prevention/', source: 'CDC', type: 'ARTICLE', trustScore: 10 },
      ]),
    },
  });

  // Patient 2 - Biomarker Trends
  await prisma.biomarkerTrend.createMany({
    data: [
      { userId: patient2.id, biomarkerType: 'hba1c', value: 6.1, unit: '%', recordedDate: new Date('2025-01-10') },
      { userId: patient2.id, biomarkerType: 'hba1c', value: 5.9, unit: '%', recordedDate: new Date('2025-04-15') },
      { userId: patient2.id, biomarkerType: 'hba1c', value: 5.8, unit: '%', recordedDate: new Date('2025-07-20') },
      { userId: patient2.id, biomarkerType: 'hba1c', value: 5.8, unit: '%', recordedDate: new Date('2025-10-22'), reportId: p2Report1.id },
      { userId: patient2.id, biomarkerType: 'glucose_fasting', value: 112, unit: 'mg/dL', recordedDate: new Date('2025-01-10') },
      { userId: patient2.id, biomarkerType: 'glucose_fasting', value: 108, unit: 'mg/dL', recordedDate: new Date('2025-04-15') },
      { userId: patient2.id, biomarkerType: 'glucose_fasting', value: 104, unit: 'mg/dL', recordedDate: new Date('2025-10-22'), reportId: p2Report1.id },
    ],
  });

  // Patient 2 - Multiple Health Goals
  const p2Goal1 = await prisma.healthGoal.create({
    data: {
      patientProfileId: patient2Profile.id,
      title: 'Reverse Prediabetes - Lower HbA1c',
      description: 'Reduce HbA1c from 6.1% to below 5.7% (normal range)',
      targetMetric: 'hba1c',
      currentValue: 6.1,
      targetValue: 5.6,
      unit: '%',
      targetDate: new Date('2026-01-10'),
      status: 'IN_PROGRESS',
      createdBy: patient2.id,
    },
  });

  await prisma.goalProgress.createMany({
    data: [
      { goalId: p2Goal1.id, value: 6.1, recordedAt: new Date('2025-01-10') },
      { goalId: p2Goal1.id, value: 5.9, recordedAt: new Date('2025-04-15') },
      { goalId: p2Goal1.id, value: 5.8, notes: 'Lost 6kg! Exercising 4x/week', recordedAt: new Date('2025-07-20') },
    ],
  });

  const p2Goal2 = await prisma.healthGoal.create({
    data: {
      patientProfileId: patient2Profile.id,
      title: 'Weight Loss for Diabetes Prevention',
      description: 'Lose 10kg to reduce diabetes risk (current: 82kg, target: 72kg)',
      targetMetric: 'weight',
      currentValue: 82,
      targetValue: 72,
      unit: 'kg',
      targetDate: new Date('2026-01-10'),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.goalProgress.createMany({
    data: [
      { goalId: p2Goal2.id, value: 82, recordedAt: new Date('2025-01-10') },
      { goalId: p2Goal2.id, value: 79, recordedAt: new Date('2025-04-15') },
      { goalId: p2Goal2.id, value: 76, recordedAt: new Date('2025-07-20') },
      { goalId: p2Goal2.id, value: 76, notes: 'Maintaining weight, building muscle', recordedAt: new Date('2025-10-22') },
    ],
  });
  console.log('✓ Created health goals for patient 2');

  // Patient 2 - Risk Assessment
  await prisma.riskAssessment.create({
    data: {
      userId: patient2.id,
      assessmentType: 'DIABETES_RISK',
      score: 8,
      riskCategory: 'HIGH',
      riskPercentage: 40.0,
      factors: { age: 38, bmi: 31.2, waistCircumference: 96, familyHistory: true, hba1c: 5.8 },
      recommendations: '🎯 Continue weight loss journey (target: additional 4kg)\n🥗 Low-glycemic diet with portion control\n🏃 Increase physical activity to 200 min/week\n💊 Continue metformin as prescribed\n📊 Monitor glucose regularly',
      validUntil: new Date('2026-10-25'),
    },
  });

  // ============================================================================
  // PATIENT 3: James Chen - Young & Healthy, Preventive Care Focus
  // ============================================================================
  const patient3Password = await bcrypt.hash('demo123', 10);
  const patient3 = await prisma.user.upsert({
    where: { email: 'james.chen@demo.com' },
    update: {},
    create: {
      email: 'james.chen@demo.com',
      name: 'James Chen',
      password: patient3Password,
      role: 'PATIENT',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created patient 3:', patient3.email);

  const patient3Profile = await prisma.patientProfile.upsert({
    where: { userId: patient3.id },
    update: {},
    create: {
      userId: patient3.id,
      age: 29,
      biologicalSex: 'Male',
      weight: 73.0,
      height: 180,
      bloodType: 'B+',
      allergies: 'Seasonal pollen',
      medications: 'None',
      medicalHistory: 'Generally healthy, no major illnesses or surgeries',
      chronicIllness: 'None',
      familyHistory: 'Parents healthy, Grandfather: Hypertension',
      smokingStatus: 'NEVER',
      diabetesStatus: false,
      healthScore: 92.0,
    },
  });
  console.log('✓ Created patient 3 profile - healthy baseline');

  // Patient 3 - Preventive Screening
  const p3Report1 = await prisma.medicalReport.create({
    data: {
      userId: patient3.id,
      title: 'Annual Physical - Complete Metabolic Panel',
      description: 'Preventive health screening for healthy 29-year-old',
      reportType: 'BLOOD_TEST',
      fileUrl: 'p3-physical-oct2025',
      fileName: 'annual-physical-2025.pdf',
      fileSize: 189234,
      mimeType: 'application/pdf',
      status: 'ANALYZED',
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      reportId: p3Report1.id,
      analysisType: 'BLOOD_TEST_ANALYSIS',
      findings: JSON.stringify({
        cholesterol: { total: 175, hdl: 58, ldl: 98, triglycerides: 95 },
        glucose: 88,
        creatinine: 0.9,
      }),
      patientSummary: 'Excellent results! All values are within optimal ranges. Your cholesterol levels are fantastic—total cholesterol 175 mg/dL, HDL ("good" cholesterol) is high at 58, and LDL is well below 100. Glucose is perfect. Keep up your healthy lifestyle!',
      technicalSummary: 'Complete metabolic panel shows optimal values. Lipid profile: TC 175 mg/dL, HDL 58 mg/dL (protective), LDL 98 mg/dL (optimal), TG 95 mg/dL. Fasting glucose 88 mg/dL. Kidney function normal (Cr 0.9). Excellent cardiovascular health markers. Continue preventive care.',
      confidence: 0.97,
      riskLevel: 'LOW',
      recommendations: 'Maintain current healthy habits. Continue regular exercise and balanced diet. Repeat comprehensive screening in 2-3 years or sooner if lifestyle changes.',
      modelUsed: 'gpt-5',
      biomarkers: {
        cholesterol_total: 175,
        cholesterol_hdl: 58,
        cholesterol_ldl: 98,
        triglycerides: 95,
        glucose_fasting: 88,
        creatinine: 0.9,
      },
      educationalLinks: JSON.stringify([
        { title: 'Maintaining Heart Health in Your 20s-30s', url: 'https://www.heart.org/en/healthy-living', source: 'AHA', type: 'ARTICLE', trustScore: 10 },
      ]),
    },
  });

  // Patient 3 - Single Biomarker Entry (First time)
  await prisma.biomarkerTrend.createMany({
    data: [
      { userId: patient3.id, biomarkerType: 'cholesterol_total', value: 175, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p3Report1.id },
      { userId: patient3.id, biomarkerType: 'cholesterol_hdl', value: 58, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p3Report1.id },
      { userId: patient3.id, biomarkerType: 'cholesterol_ldl', value: 98, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p3Report1.id },
      { userId: patient3.id, biomarkerType: 'glucose_fasting', value: 88, unit: 'mg/dL', recordedDate: new Date('2025-10-20'), reportId: p3Report1.id },
    ],
  });

  // Patient 3 - Preventive Health Goal
  await prisma.healthGoal.create({
    data: {
      patientProfileId: patient3Profile.id,
      title: 'Maintain Optimal Cholesterol Levels',
      description: 'Keep total cholesterol below 200 mg/dL through healthy lifestyle',
      targetMetric: 'cholesterol_total',
      currentValue: 175,
      targetValue: 200,
      unit: 'mg/dL',
      targetDate: new Date('2027-10-20'),
      status: 'IN_PROGRESS',
      createdBy: patient3.id,
    },
  });
  console.log('✓ Created preventive health goal for patient 3');

  // ============================================================================
  // DOCTOR 1: Dr. Sarah Martinez - Cardiologist
  // ============================================================================
  const doctor1Password = await bcrypt.hash('demo123', 10);
  const doctor1 = await prisma.user.upsert({
    where: { email: 'dr.martinez@medlyze.com' },
    update: {},
    create: {
      email: 'dr.martinez@medlyze.com',
      name: 'Dr. Sarah Martinez',
      password: doctor1Password,
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created doctor 1:', doctor1.email);

  await prisma.doctorProfile.upsert({
    where: { userId: doctor1.id },
    update: {},
    create: {
      userId: doctor1.id,
      specialty: 'Cardiology',
      licenseNumber: 'CA-MD-98765',
      hospital: 'Stanford Medical Center',
      yearsExperience: 18,
      bio: 'Board-certified cardiologist specializing in preventive cardiology, lipid management, and cardiovascular risk assessment. Fellowship-trained at Johns Hopkins. Passionate about using data-driven approaches to prevent heart disease.',
    },
  });
  console.log('✓ Created doctor 1 profile');

  // Grant Dr. Martinez access to Patient 1 (Michael - high cholesterol)
  await prisma.doctorPatientAccess.create({
    data: {
      doctorId: doctor1.id,
      patientId: patient1.id,
      status: 'APPROVED',
    },
  });

  // Dr. Martinez reviews Patient 1's lipid panel
  await prisma.doctorNote.create({
    data: {
      reportId: p1Report1.id,
      doctorId: doctor1.id,
      diagnosis: 'Hyperlipidemia - Responding Well to Therapy',
      notes: 'Patient shows excellent response to atorvastatin 20mg. LDL reduced from 165 to 115 mg/dL (30% reduction). However, HDL remains borderline low at 48 mg/dL and triglycerides are elevated at 160 mg/dL. Patient reports good adherence to Mediterranean diet and walking 30 min daily. Family history significant for premature CAD. Framingham 10-year risk approximately 20-25% (moderate-high).',
      followUp: 'Continue atorvastatin 20mg. Add omega-3 fatty acids 2-4g daily for triglycerides. Increase aerobic exercise to 45-60 min most days to raise HDL. Repeat lipid panel in 6 months. Consider increasing statin if LDL not <100. Monitor liver enzymes. Discussed aspirin - patient already on 81mg. RTC 6 months or sooner if symptoms develop.',
    },
  });
  console.log('✓ Created doctor notes for patient 1');

  // ============================================================================
  // DOCTOR 2: Dr. James Williams - Endocrinologist
  // ============================================================================
  const doctor2Password = await bcrypt.hash('demo123', 10);
  const doctor2 = await prisma.user.upsert({
    where: { email: 'dr.williams@medlyze.com' },
    update: {},
    create: {
      email: 'dr.williams@medlyze.com',
      name: 'Dr. James Williams',
      password: doctor2Password,
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created doctor 2:', doctor2.email);

  await prisma.doctorProfile.upsert({
    where: { userId: doctor2.id },
    update: {},
    create: {
      userId: doctor2.id,
      specialty: 'Endocrinology',
      licenseNumber: 'CA-MD-54321',
      hospital: 'UCLA Medical Center',
      yearsExperience: 12,
      bio: 'Board-certified endocrinologist with expertise in diabetes prevention and management, thyroid disorders, and metabolic syndrome. Strong advocate for lifestyle medicine and patient empowerment through technology.',
    },
  });
  console.log('✓ Created doctor 2 profile');

  // Grant Dr. Williams access to Patient 2 (Priya - prediabetic)
  await prisma.doctorPatientAccess.create({
    data: {
      doctorId: doctor2.id,
      patientId: patient2.id,
      status: 'APPROVED',
    },
  });

  // Grant Dr. Williams access to Patient 3 (James - preventive)
  await prisma.doctorPatientAccess.create({
    data: {
      doctorId: doctor2.id,
      patientId: patient3.id,
      status: 'APPROVED',
    },
  });

  // Dr. Williams reviews Patient 2's diabetes screening
  await prisma.doctorNote.create({
    data: {
      reportId: p2Report1.id,
      doctorId: doctor2.id,
      diagnosis: 'Prediabetes - Significant Improvement with DPP',
      notes: 'Patient enrolled in Diabetes Prevention Program 10 months ago. Excellent progress: HbA1c decreased from 6.1% to 5.8%, fasting glucose from 112 to 104 mg/dL, weight loss of 6kg (from 82kg to 76kg). Patient highly motivated, tracking food intake, exercising 4-5x/week (walking, yoga). On metformin 500mg BID with good tolerance. PCOS also improving with weight loss - reports more regular cycles. Strong family history of T2DM (mother, maternal grandmother). Current diabetes risk: HIGH but improving.',
      followUp: 'Outstanding work! Continue current plan: metformin 500mg BID, target additional 4-6kg weight loss. Aim for 200 min/week moderate exercise. Low-glycemic diet. Repeat HbA1c in 3 months - if <5.7%, consider tapering metformin. Consider CGM for 2 weeks to identify glucose patterns. Refer to registered dietitian for meal planning support. RTC 3 months. If HbA1c continues to improve, may achieve full diabetes prevention!',
    },
  });
  console.log('✓ Created doctor notes for patient 2');

  // Dr. Williams also reviews Patient 3's preventive screening
  await prisma.doctorNote.create({
    data: {
      reportId: p3Report1.id,
      doctorId: doctor2.id,
      diagnosis: 'Excellent Health Status - Preventive Care',
      notes: 'Healthy 29-year-old male for annual preventive screening. All biomarkers optimal: lipid panel excellent (TC 175, HDL 58, LDL 98, TG 95), fasting glucose 88, kidney function normal. BMI 22.5 (healthy). Non-smoker, exercises regularly, balanced diet. Minimal family history (grandfather with HTN only). 10-year CVD risk <5% (very low). This is a model of healthy aging - excellent opportunity to maintain this baseline through continued healthy behaviors.',
      followUp: 'Continue current healthy lifestyle. No medications needed. Encourage maintaining healthy weight, regular exercise (mix of cardio and strength training), balanced diet rich in vegetables/fruits/whole grains. Repeat comprehensive metabolic screening in 3 years or sooner if concerns arise. Educate on importance of preventive care - easier to maintain health than to regain it. Discussed heart-healthy lifestyle for long-term CVD prevention.',
    },
  });
  console.log('✓ Created doctor notes for patient 3');

  console.log('\n✅ Database seeded successfully with comprehensive health tracking data!\n');
  console.log('📧 Test credentials (all passwords: demo123):');
  console.log('\n👥 PATIENTS:');
  console.log('   1. Michael Rodriguez (High cholesterol, active management)');
  console.log('      📧 michael.rodriguez@demo.com');
  console.log('   2. Priya Patel (Prediabetic, weight loss journey)');
  console.log('      📧 priya.patel@demo.com');
  console.log('   3. James Chen (Young & healthy, preventive care)');
  console.log('      📧 james.chen@demo.com');
  console.log('\n👨‍⚕️ DOCTORS:');
  console.log('   1. Dr. Sarah Martinez (Cardiologist) - Has access to Michael');
  console.log('      📧 dr.martinez@medlyze.com');
  console.log('   2. Dr. James Williams (Endocrinologist) - Has access to Priya & James');
  console.log('      📧 dr.williams@medlyze.com');
  console.log('\n📊 Demo Features Included:');
  console.log('   ✓ Biomarker trends (cholesterol, glucose, HbA1c)');
  console.log('   ✓ Health goals with progress tracking');
  console.log('   ✓ Risk assessments (Framingham, Diabetes)');
  console.log('   ✓ Educational resources');
  console.log('   ✓ Doctor-patient relationships');
  console.log('   ✓ Medical reports with AI analysis\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
