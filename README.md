# Medlyze - AI-Powered Diagnostic Support Platform 🏥

**Medlyze** is a secure, HIPAA-compliant platform that enables patients to upload medical reports and receive instant AI-powered analysis. The platform facilitates seamless collaboration between patients and doctors, providing both patient-friendly summaries and technical medical insights.

## Features 🚀

### For Patients
- **Upload Medical Reports**: Support for X-rays, CT scans, MRIs, ECGs, blood tests, and pathology reports (PDF, PNG, JPEG up to 10MB)
- **Advanced AI Analysis**:
  - Specialized LLM models (GPT-5) with medical domain expertise
  - Vision-capable analysis for interpreting medical images, waveforms, and scans
  - Patient-friendly explanations alongside technical medical summaries
  - Context-aware analysis using your complete medical history
  - Automatic biomarker extraction for longitudinal tracking
- **Longitudinal Health Tracking**: 🆕
  - Automatic tracking of biomarkers from medical reports (cholesterol, blood pressure, glucose, etc.)
  - Trend analysis showing improvement, worsening, or stable patterns
  - Visual charts displaying health metrics over time
  - Alerts for values outside healthy ranges
- **Risk Assessment**: 🆕
  - Framingham 10-year cardiovascular disease risk score
  - Type 2 diabetes risk stratification
  - Overall health score (0-100) based on comprehensive data
  - Personalized risk reduction recommendations
- **Health Goals**: 🆕
  - Set and track personalized health goals (lower BP, reduce weight, improve cholesterol)
  - Progress tracking with percentage completion
  - Celebratory milestones when goals are achieved
  - Educational resources tailored to your goals
- **Educational Resources**: 🆕
  - Curated articles and videos from trusted medical sources (AHA, CDC, Mayo Clinic, Harvard Health)
  - Condition-specific educational content based on your reports
  - Interactive tools and infographics for better health understanding
- **Privacy-by-Design**: Automatic de-identification and PII masking before AI analysis
- **Doctor Collaboration**: Grant and revoke access to doctors for seamless consultation
- **Secure Storage**: AES-256 encryption for all medical files at rest and in transit
- **Complete Medical Profile**: Track demographics, medications, allergies, chronic conditions, and medical history

### For Doctors
- **Patient Management**: View all patients who have granted you access
- **Report Review**: Access patient reports with AI analysis insights
- **Longitudinal View**: 🆕
  - Track patient biomarkers and health metrics over time
  - View trend analysis and identify concerning patterns
  - Access comprehensive risk assessments (Framingham, diabetes risk)
  - Monitor patient progress toward health goals
- **Add Professional Notes**: Provide diagnosis, notes, and follow-up recommendations
- **Comprehensive Patient View**: See complete patient demographics, medical history, and risk profile
- **Real-time Updates**: Instant access when patients share new reports
- **Goal Setting**: 🆕 Collaborate with patients to set and monitor health goals

### Core Technology Stack ⚡

- **Next.js 15.3.0**: Modern React framework with server-side rendering
- **PostgreSQL with Prisma**: Robust relational database with type-safe ORM
- **NextAuth**: Secure authentication with role-based access control (Patient/Doctor)
- **LLM Integration**: 
  - Specialized medical analysis prompts for each report type (ECG, X-Ray, CT, MRI, Blood Tests, Pathology)
  - Vision-capable multimodal analysis for interpreting medical images
  - PDFRest API for PDF-to-image conversion to enable visual analysis
- **Privacy & De-identification**: Regex-based PII masking system removes sensitive data before AI processing
- **Stripe**: Subscription payment processing for premium features
- **Tailwind CSS**: Modern, responsive UI design

### Security & Compliance 🔒

- **HIPAA Compliant**: Full medical data protection compliance
- **AES-256 Encryption**: Military-grade encryption for all stored files with separate IV storage
- **Privacy-by-Design AI**: 
  - Automatic de-identification before LLM processing
  - Masks 10+ PII types: names, emails, phones, SSN, addresses, dates, MRNs, etc.
  - Patient demographics sanitized and contextualized for medical analysis
  - No raw sensitive data sent to external AI services
- **Role-Based Access Control**: Granular permissions for patients and doctors
- **Access Management**: Patients have full control over who can view their reports

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- LLM API access
- PDFRest API key (for PDF-to-image conversion)
- Stripe account (for payments)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/anayy09/medlyze.git
cd medlyze
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

**Note:** The `legacy-peer-deps` flag is required due to peer dependency constraints with React 19.

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# LLM Configuration
LLM_API_URL="https://xxx.xxx/api/chat/completions"
LLM_API_KEY="your-llm-api-key"
LLM_MODEL="gpt-5"

# PDF Processing
PDFREST_API_KEY="your-pdfrest-api-key"

# File Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
```

4. Set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with demo users and data
npx prisma db seed
```

This will create 5 demo users:
- **3 Patients**: Michael Rodriguez (high cholesterol), Priya Patel (prediabetic), James Chen (healthy)
- **2 Doctors**: Dr. Sarah Martinez (Cardiologist), Dr. James Williams (Endocrinologist)
- All demo accounts use password: `demo123`

The seed includes complete health tracking data: biomarker trends, health goals, risk assessments, and medical reports with AI analysis.

5. Run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
medlyze/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (site)/
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   └── dashboard/     # Patient & Doctor dashboards
│   │   └── api/               # API routes
│   │       ├── ai/            # AI analysis endpoints
│   │       └── health/        # 🆕 Health tracking, risk assessment, goals
│   ├── components/            # React components
│   ├── lib/
│   │   ├── llmAnalysis.ts     # LLM integration with specialized medical prompts
│   │   ├── deidentification.ts # PII masking and privacy utilities
│   │   ├── pdfToImage.ts      # PDF-to-image conversion via PDFRest
│   │   ├── fileStorage.ts     # AES-256 file encryption/decryption
│   │   ├── riskAssessment.ts  # 🆕 Framingham & diabetes risk calculators
│   │   ├── trendAnalysis.ts   # 🆕 Longitudinal biomarker tracking
│   │   └── educationalContent.ts # 🆕 Curated health education resources
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript types
└── public/
    └── uploads/               # Encrypted file storage
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/register` - User registration
- `POST /api/forgot-password` - Password reset

### AI Analysis
- `POST /api/ai/analyze` - Comprehensive medical report analysis
  - Supports PDF (with image extraction), PNG, JPEG formats
  - Automatic PII de-identification before LLM processing
  - Vision-capable analysis for ECG waveforms, X-rays, scans
  - Context-aware using patient medical history
  - Specialized prompts for: ECG, X-Ray, CT Scan, MRI, Blood Tests, Pathology
  - Biomarker extraction and longitudinal tracking 🆕
  - Educational content recommendations 🆕

### Health Tracking 🆕
- `GET /api/health/trends` - Get longitudinal biomarker trends
- `POST /api/health/trends` - Manually add biomarker data point
- `GET /api/health/risk-assessment` - Get latest risk assessments
- `POST /api/health/risk-assessment` - Calculate comprehensive risk profile (Framingham, diabetes)
- `GET /api/health/goals` - Get all patient health goals
- `POST /api/health/goals` - Create new health goal
- `PATCH /api/health/goals` - Update goal status or record progress

### Patient APIs
- `GET /api/patient/profile` - Get patient profile
- `POST /api/patient/profile` - Update patient profile
- `POST /api/reports/upload` - Upload and encrypt medical report
- `POST /api/ai/analyze` - Analyze report with LLM (includes automatic de-identification)
- `GET /api/reports` - Get all patient reports
- `GET /api/download/[fileId]` - Download and decrypt report file

### Doctor APIs
- `GET /api/doctor/patients` - Get all accessible patients
- `GET /api/doctor/patient/[patientId]` - Get patient details with reports
- `POST /api/doctor/notes` - Add doctor notes to a report

### Access Control
- `POST /api/access` - Grant/revoke doctor access
- `GET /api/access/status` - Check access status

## Key Features in Detail

### AI-Powered Medical Analysis
- **Specialized Medical Models**: Uses GPT-5 with domain-specific prompts for each medical report type
- **Vision Capabilities**: Multimodal analysis interprets visual medical data:
  - ECG waveforms and intervals
  - X-ray and CT scan abnormalities
  - MRI tissue characteristics
  - Pathology slide features
- **Contextual Understanding**: Incorporates patient demographics, medications, chronic conditions, and family history for personalized insights
- **Dual Summaries**: Generates both patient-friendly explanations and technical medical assessments

### Privacy & De-identification System
- **Automatic PII Masking**: Removes sensitive information before AI processing:
  - Patient names → `[PATIENT_NAME]`
  - Email addresses → `[EMAIL]`
  - Phone numbers → `[PHONE]`
  - SSN/ID numbers → `[ID_NUMBER]`
  - Addresses → `[ADDRESS]`
  - Medical record numbers → `[MRN]`
  - Dates (except clinically relevant) → `[DATE]`
- **Structured Context**: Patient info is provided as structured clinical context (age, gender, medical history) rather than raw identifiable data
- **No Data Retention**: De-identified data is only used for analysis and not stored by external AI services

### PDF Processing Pipeline
1. **Upload**: Encrypted storage with AES-256
2. **Decryption**: Secure access with role-based permissions
3. **Conversion**: PDFRest API converts pages to high-quality images
4. **Extraction**: Both visual content and any embedded text
5. **Analysis**: Multimodal LLM processes images + context
6. **Biomarker Extraction**: 🆕 Automatic identification and storage of key health metrics
7. **Response**: Structured JSON with findings, risk levels, recommendations, and educational resources

### Longitudinal Health Management 🆕

The platform now includes sophisticated health tracking capabilities:

#### Biomarker Tracking
- **Automatic Extraction**: Biomarkers are automatically identified from medical reports
  - Blood tests: Cholesterol (total, HDL, LDL), triglycerides, glucose, HbA1c, creatinine
  - ECG: Heart rate, QTc interval
  - Blood pressure measurements
- **Trend Analysis**: Machine learning algorithms detect patterns over time
  - Linear regression to identify improving/worsening/stable trends
  - Percentage change calculations between measurements
  - Alerts for values outside healthy ranges
- **Visualization**: Historical data plotted on interactive charts

#### Risk Stratification
- **Framingham Risk Score**: Evidence-based 10-year cardiovascular disease risk
  - Considers age, sex, cholesterol levels, blood pressure, smoking, diabetes
  - Returns percentage risk and risk category (LOW to VERY_HIGH)
  - Personalized recommendations for risk reduction
- **Diabetes Risk Assessment**: Type 2 diabetes probability
  - Based on ADA/CDC guidelines
  - Factors: Age, BMI, waist circumference, family history, glucose levels
  - Prediabetes detection and prevention strategies
- **Health Score (0-100)**: Comprehensive health metric combining:
  - Cardiovascular risk factors
  - Diabetes risk indicators
  - Lifestyle factors (smoking status)
  - Recent biomarker trends

#### Goal Setting & Tracking
- **SMART Goals**: Specific, measurable health objectives
  - Examples: "Reduce LDL cholesterol to 100 mg/dL by June 2025"
  - "Lower blood pressure from 140/90 to 120/80 in 3 months"
- **Progress Monitoring**: Regular updates and percentage completion
- **Achievement System**: Celebratory notifications and milestone tracking
- **Educational Support**: Goal-specific resources and guidance

#### Educational Content Library
Over 50 curated resources from trusted medical organizations:
- **American Heart Association**: CVD, hypertension, cholesterol
- **CDC**: Diabetes prevention, smoking cessation
- **Mayo Clinic**: General health and condition-specific guidance
- **Harvard Health**: Evidence-based nutrition and lifestyle
- **Content Types**: Articles, videos, interactive tools, infographics
- **Trust Scoring**: Resources rated 1-10 based on source credibility

## Acknowledgments

Built with modern technologies including Next.js, Prisma, LLM APIs, PDFRest, and Tailwind CSS.

---

**⚕️ Empowering patients and doctors with AI-powered diagnostic support.**
