# FindIt CSUN

FindIt CSUN is a campus lost-and-found web app for California State University, Northridge. Students can post lost or found items, browse and search active posts, submit claims, and get automatic match suggestions between opposite-type posts (a "lost" item is matched against "found" items and vice versa).

Built for **COMP 380/L** as a class project.

## Features

- **Post lost & found items** — title, description, category, location, photo, and date
- **AI-assisted tagging** — uploaded photos are sent to Claude (Haiku) via a serverless function to generate descriptive tags, which improve match quality
- **Automatic match suggestions** — a Jaccard-similarity algorithm compares tags between opposite-type items and writes suggested matches for both posts involved
- **Claims** — users can submit a claim on an item and the poster can review and act on it
- **Reporting & moderation** — users can report posts; admins can review, resolve, or take action on reports
- **Admin dashboard** — manage reports and moderation status across the platform
- **Authentication** — email/password auth via Firebase, with password reset emails delivered through SendGrid (Firebase's default mailer is blocked by CSUN's spam filter)
- **Account management** — edit profile, complete-profile flow for new users, delete account

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Backend / Auth / DB | Firebase (Authentication, Firestore) |
| Image hosting | Cloudinary |
| Serverless functions | Vercel (`/api`) |
| AI tagging | Anthropic API (Claude Haiku) |
| Transactional email | Twilio SendGrid |
| Hosting | Vercel |
| CI | GitHub Actions (ESLint) |

## Project Structure

```
├── api/                     # Vercel serverless functions
│   ├── analyze-image.js     # Sends item photos to Claude for AI tag generation
│   └── send-reset-email.js  # Sends password reset emails via SendGrid
├── src/
│   ├── components/          # Shared UI components (Navbar, forms, route guards, etc.)
│   ├── pages/                # Route-level pages (Home, Browse, Account, Admin, etc.)
│   ├── firebase/             # Firebase config & Firestore data access
│   ├── services/              # Cloudinary upload service
│   ├── utils/                 # Matching algorithm (Jaccard similarity)
│   └── constants/              # Shared constants (categories, etc.)
└── public/
```

## Getting Started

### Prerequisites

- Node.js 20+
- A Firebase project (Authentication + Firestore enabled)
- A Cloudinary account (for image uploads)
- An Anthropic API key (for AI photo tagging)
- A SendGrid account (for password reset emails)

### Installation

```bash
git clone https://github.com/QuakerSoft/FindIt.git
cd FindIt
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

The serverless functions in `/api` also require these (set in your Vercel project's environment variables, not in `.env`):

```
ANTHROPIC_API_KEY=
FIREBASE_SERVICE_ACCOUNT=      # minified single-line service account JSON
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> Note: the `/api` serverless functions only run on Vercel. Use `vercel dev` if you need to test AI tagging or password-reset emails locally.

### Linting

```bash
npm run lint
```

ESLint runs automatically on every push and pull request to `main` via GitHub Actions.

### Building for Production

```bash
npm run build
npm run preview
```

## Deployment

The app is deployed on Vercel. Pushes to `main` trigger a production deployment; the `/api` folder is deployed automatically as Vercel serverless functions.

## Team

Built for **COMP 380/L**: 
- Devin: DevOps(CI/CD), Frontend Developer
- Van: Designer
- Isamar: Frontend Developer
- Sumchhay: Frontend Developer 
- Impress: Full Stack Developer
- Nhan: SCRUM Master, Product Manager
