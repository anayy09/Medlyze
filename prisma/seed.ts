import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Patient User
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patient = await prisma.user.upsert({
    where: { email: 'patient@medlyze.com' },
    update: {},
    create: {
      email: 'patient@medlyze.com',
      name: 'John Patient',
      password: patientPassword,
      role: 'PATIENT',
      emailVerified: new Date(),
    },
  });

  console.log('✓ Created patient user:', patient.email);

  // Create Patient Profile
  await prisma.patientProfile.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      age: 35,
      biologicalSex: 'Male',
      weight: 75.5,
      height: 178,
      bloodType: 'A+',
      allergies: 'Penicillin, Pollen',
      medications: 'Lisinopril 10mg daily',
      medicalHistory: 'Hypertension diagnosed 2020, no major surgeries',
      chronicIllness: 'Hypertension (controlled)',
      familyHistory: 'Father: Heart disease, Mother: Diabetes Type 2',
    },
  });

  console.log('✓ Created patient profile');

  // Create Doctor User
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@medlyze.com' },
    update: {},
    create: {
      email: 'doctor@medlyze.com',
      name: 'Dr. Sarah Smith',
      password: doctorPassword,
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  });

  console.log('✓ Created doctor user:', doctor.email);

  // Create Doctor Profile
  await prisma.doctorProfile.upsert({
    where: { userId: doctor.id },
    update: {},
    create: {
      userId: doctor.id,
      specialty: 'Cardiology',
      licenseNumber: 'MD-12345-CA',
      hospital: 'City General Hospital',
      yearsExperience: 15,
      bio: 'Board-certified cardiologist with 15 years of experience in diagnostic cardiology and preventive care. Specialized in interpreting ECGs, stress tests, and cardiac imaging.',
    },
  });

  console.log('✓ Created doctor profile');

  // Create Second Patient
  const patient2Password = await bcrypt.hash('patient456', 10);
  const patient2 = await prisma.user.upsert({
    where: { email: 'jane@medlyze.com' },
    update: {},
    create: {
      email: 'jane@medlyze.com',
      name: 'Jane Doe',
      password: patient2Password,
      role: 'PATIENT',
      emailVerified: new Date(),
    },
  });

  console.log('✓ Created second patient user:', patient2.email);

  // Create Patient Profile for Jane
  await prisma.patientProfile.upsert({
    where: { userId: patient2.id },
    update: {},
    create: {
      userId: patient2.id,
      age: 28,
      biologicalSex: 'Female',
      weight: 62.0,
      height: 165,
      bloodType: 'O+',
      allergies: 'None known',
      medications: 'None',
      medicalHistory: 'Generally healthy, annual checkups normal',
    },
  });

  console.log('✓ Created second patient profile');

  // Create Sample Medical Report for Patient 1
  const sampleReport = await prisma.medicalReport.create({
    data: {
      userId: patient.id,
      title: 'ECG Report - Routine Checkup',
      description: 'Annual cardiac screening ECG',
      reportType: 'ECG',
      fileUrl: 'sample-ecg-001', // This would be the fileId from storage
      fileName: 'ecg-2025-01-15.pdf',
      fileSize: 245678,
      mimeType: 'application/pdf',
      status: 'ANALYZED',
    },
  });

  console.log('✓ Created sample medical report');

  // Create AI Analysis for the Report
  await prisma.aIAnalysis.create({
    data: {
      reportId: sampleReport.id,
      analysisType: 'ECG_ANALYSIS',
      findings: JSON.stringify({
        heartRate: 72,
        rhythm: 'Normal sinus rhythm',
        intervals: {
          PR: '160ms',
          QRS: '90ms',
          QT: '400ms',
        },
        abnormalities: [],
      }),
      patientSummary:
        'Your ECG shows a normal heart rhythm with a heart rate of 72 beats per minute. All electrical intervals are within normal ranges. No concerning abnormalities were detected.',
      technicalSummary:
        'Normal sinus rhythm at 72 bpm. PR interval 160ms, QRS duration 90ms, QTc 400ms. No ST-T wave abnormalities. No evidence of ischemia, infarction, or arrhythmia.',
      confidence: 0.95,
      riskLevel: 'LOW',
      recommendations:
        'Continue regular monitoring. Maintain healthy lifestyle. Next routine screening in 12 months.',
      modelUsed: 'ECG-Analyzer-v2.1',
    },
  });

  console.log('✓ Created AI analysis for sample report');

  // Grant doctor access to patient
  await prisma.doctorPatientAccess.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      status: 'APPROVED',
    },
  });

  console.log('✓ Created doctor-patient access relationship');

  // Create Doctor Note for the Report
  await prisma.doctorNote.create({
    data: {
      reportId: sampleReport.id,
      doctorId: doctor.id,
      diagnosis: 'Normal cardiac electrical activity',
      notes:
        'Reviewed ECG and AI analysis. Findings are consistent with healthy cardiac function. Patient reports no chest pain, palpitations, or shortness of breath. Blood pressure readings are well-controlled on current medication.',
      followUp: 'Continue current medication regimen. Annual follow-up ECG recommended. Patient should monitor blood pressure at home weekly.',
    },
  });

  console.log('✓ Created doctor note for sample report');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('📧 Test credentials:');
  console.log('   Patient: patient@medlyze.com / patient123');
  console.log('   Patient 2: jane@medlyze.com / patient456');
  console.log('   Doctor: doctor@medlyze.com / doctor123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
