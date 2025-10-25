# Medlyze - AI-Powered Diagnostic Support Platform 🏥

**Medlyze** is a secure, HIPAA-compliant platform that enables patients to upload medical reports and receive instant AI-powered analysis. The platform facilitates seamless collaboration between patients and doctors, providing both patient-friendly summaries and technical medical insights.

## Features 🚀

### For Patients
- **Upload Medical Reports**: Support for X-rays, CT scans, MRIs, ECGs, blood tests, and pathology reports (PDF, PNG, JPEG up to 10MB)
- **AI-Powered Analysis**: Get instant insights with both patient-friendly and technical summaries
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
- **OpenAI Integration**: Advanced AI models for medical report analysis
- **Stripe**: Subscription payment processing for premium features
- **Tailwind CSS**: Modern, responsive UI design

### Security & Compliance 🔒

- **HIPAA Compliant**: Full medical data protection compliance
- **AES-256 Encryption**: Military-grade encryption for all stored files
- **Role-Based Access Control**: Granular permissions for patients and doctors
- **Access Management**: Patients have full control over who can view their reports

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- OpenAI API key
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
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
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

### Patient APIs
- `GET /api/patient/profile` - Get patient profile
- `POST /api/patient/profile` - Update patient profile
- `POST /api/upload` - Upload and analyze medical report
- `GET /api/reports` - Get all patient reports
- `GET /api/download/[fileId]` - Download report file

### Doctor APIs
- `GET /api/doctor/patients` - Get all accessible patients
- `GET /api/doctor/patient/[patientId]` - Get patient details with reports
- `POST /api/doctor/notes` - Add doctor notes to a report

### Access Control
- `POST /api/access` - Grant/revoke doctor access
- `GET /api/access/status` - Check access status

## Deployment

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmedlyze)

### Deploy on Netlify

[![Deploy with Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/medlyze)

### Environment Configuration

Ensure all environment variables are properly configured in your deployment platform:
- Database connection string
- NextAuth configuration
- OpenAI API key
- Stripe keys
- Encryption key

## Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## License

This project is open-source and available under the MIT License.

## Acknowledgments

Built with modern technologies including Next.js, Prisma, OpenAI, and Tailwind CSS.

---

**⚕️ Empowering patients and doctors with AI-powered diagnostic support.**
