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
- **Privacy-by-Design**: Automatic de-identification and PII masking before AI analysis
- **Doctor Collaboration**: Grant and revoke access to doctors for seamless consultation
- **Secure Storage**: AES-256 encryption for all medical files at rest and in transit
- **Complete Medical Profile**: Track demographics, medications, allergies, chronic conditions, and medical history

### For Doctors
- **Patient Management**: View all patients who have granted you access
- **Report Review**: Access patient reports with AI analysis insights
- **Add Professional Notes**: Provide diagnosis, notes, and follow-up recommendations
- **Comprehensive Patient View**: See complete patient demographics and medical history
- **Real-time Updates**: Instant access when patients share new reports

### Core Technology Stack ⚡

- **Next.js 15.3.0**: Modern React framework with server-side rendering
- **PostgreSQL with Prisma**: Robust relational database with type-safe ORM
- **NextAuth**: Secure authentication with role-based access control (Patient/Doctor)
- **LLM Integration**: 
  - University of Florida's AI API with GPT-5 model
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
- LLM API access (University of Florida AI API or compatible endpoint)
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
npx prisma generate
npx prisma db push
npx prisma db seed
```

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
│   ├── components/            # React components
│   ├── lib/
│   │   ├── llmAnalysis.ts     # LLM integration with specialized medical prompts
│   │   ├── deidentification.ts # PII masking and privacy utilities
│   │   ├── pdfToImage.ts      # PDF-to-image conversion via PDFRest
│   │   └── fileStorage.ts     # AES-256 file encryption/decryption
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
- **Specialized Medical Models**: Uses GPT-5 via University of Florida's AI infrastructure with domain-specific prompts for each medical report type
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
6. **Response**: Structured JSON with findings, risk levels, and recommendations

## Acknowledgments

Built with modern technologies including Next.js, Prisma, LLM APIs, PDFRest, and Tailwind CSS.

---

**⚕️ Empowering patients and doctors with AI-powered diagnostic support.**
