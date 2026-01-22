# ⚡ Zephyr - AI-Powered Website Builder

<div align="center">

![Zephyr](https://img.shields.io/badge/Zephyr-AI%20Website%20Builder-6366F1?style=for-the-badge&logo=react&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

**⚡ Transform ideas into stunning websites in seconds with AI**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [API Documentation](#-api-documentation)

</div>

---

## 📖 About

**Zephyr** is a cutting-edge AI-powered website builder that transforms simple text descriptions into beautiful, fully functional websites in seconds. Built with modern technologies and best practices, Zephyr combines the power of artificial intelligence with an intuitive visual editor to make professional web development accessible to everyone - no coding knowledge required.

### ✨ Key Highlights

- 🤖 **AI-Powered Generation**: Uses OpenAI to convert natural language into production-ready HTML/CSS/JS
- ⚡ **Real-time Preview**: Instant visual feedback with live code preview
- 🎨 **Visual Editor**: Drag-and-drop interface with element-level customization
- 📜 **Version Control**: Track changes with full version history and rollback capability
- 💳 **Integrated Payments**: Seamless Stripe integration for credit purchases
- 🔐 **Secure Authentication**: Powered by Better Auth with email/password support
- 🌐 **One-Click Publishing**: Share your creations with public URLs
- 📱 **Fully Responsive**: Works seamlessly across all devices

---

## 🎯 Features

### Core Functionality

#### 🎨 AI Website Generation
- **Natural Language Processing**: Describe your website in plain English
- **Intelligent Prompt Enhancement**: AI optimizes your prompts for better results
- **Tailwind CSS Integration**: Modern, responsive designs using utility-first CSS
- **Interactive Elements**: Automatically includes JavaScript functionality

#### ✏️ Advanced Editing
- **Visual Element Editor**: Modify text, colors, spacing, and styles
- **Direct Code Editing**: For advanced users who prefer code
- **Real-time Updates**: See changes instantly in the preview pane
- **Undo/Redo Support**: Non-destructive editing workflow

#### 📊 Project Management
- **Unlimited Projects**: Create and manage multiple websites
- **Project Dashboard**: Overview of all your creations
- **Search & Filter**: Quickly find specific projects
- **Bulk Operations**: Delete or export multiple projects

#### 🔄 Version Control
- **Automatic Versioning**: Every AI revision creates a new version
- **Version History**: Browse all previous iterations
- **One-Click Rollback**: Restore any previous version
- **Version Comparison**: (Coming soon)

#### 💰 Credit System
- **Free Credits**: 20 credits on signup
- **Project Creation**: 5 credits per new website
- **Revisions**: 5 credits per AI modification
- **Flexible Pricing**: Multiple credit packages available
- **Secure Payments**: PCI-compliant Stripe integration

#### 🌐 Publishing & Sharing
- **Public URLs**: Share your websites with anyone
- **Custom Domains**: (Coming soon)
- **Download HTML**: Export complete website code
- **Embed Options**: (Coming soon)

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 19.2.0 |
| **TypeScript** | Type Safety | 5.9.3 |
| **Vite** | Build Tool | 7.2.4 |
| **React Router** | Navigation | 7.12.0 |
| **Axios** | HTTP Client | 1.13.2 |
| **Tailwind CSS** | Styling | 4.1.18 |
| **Better Auth UI** | Authentication Components | 3.3.15 |
| **Sonner** | Toast Notifications | 2.0.7 |
| **Lucide React** | Icons | 0.562.0 |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | ES2020 |
| **Express** | Web Framework | 5.2.1 |
| **TypeScript** | Type Safety | 5.9.3 |
| **Prisma** | ORM | 7.2.0 |
| **PostgreSQL** | Database | (via Neon) |
| **Better Auth** | Authentication | 1.4.16 |
| **OpenAI SDK** | AI Integration | 6.16.0 |
| **Stripe** | Payment Processing | 20.2.0 |

### Infrastructure

- **Database**: Neon PostgreSQL (Serverless)
- **Hosting**: Vercel (Frontend & Backend)
- **Authentication**: Better Auth (Session-based)
- **Payments**: Stripe (Webhook integration)
- **AI**: OpenRouter (Mistral Devstral)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or **yarn**/**pnpm**)
- **Git**: Latest version
- **PostgreSQL**: Or a Neon account (recommended)

### Required API Keys

You'll need accounts and API keys for:

1. **Neon** (Database): [console.neon.tech](https://console.neon.tech)
2. **OpenRouter** (AI): [openrouter.ai](https://openrouter.ai)
3. **Stripe** (Payments): [dashboard.stripe.com](https://dashboard.stripe.com)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/iamalok123/ai-website-builder-fullstack-PERN.git
cd ai-website-builder-fullstack-PERN
```

#### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 4. Configure Environment Variables

##### Backend (.env)

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Authentication
BETTER_AUTH_SECRET="your-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# CORS
TRUSTED_ORIGINS="http://localhost:5173"

# Environment
NODE_ENV="development"

# AI
AI_API_KEY="your-openrouter-api-key"

# Payments
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

**Generate Secrets**:
```bash
# Generate BETTER_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

##### Frontend (.env)

Create `frontend/.env`:

```env
VITE_BASEURL="http://localhost:3000"
```

#### 5. Setup Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

#### 6. Start Development Servers

**Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

#### 7. Open Application

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📚 Project Structure

```
zephyr-ai-website-builder/
├── backend/
│   ├── configs/              # Configuration files
│   │   └── openai.ts        # OpenAI client setup
│   ├── controllers/         # Request handlers
│   │   ├── ProjectController.ts
│   │   ├── userController.ts
│   │   └── stripeWebhook.ts
│   ├── generated/           # Prisma generated client
│   ├── lib/                 # Utility libraries
│   │   ├── auth.ts         # Better Auth configuration
│   │   └── prisma.ts       # Prisma client instance
│   ├── middlewares/         # Express middlewares
│   │   └── auth.ts         # Authentication middleware
│   ├── prisma/              # Database schema & migrations
│   │   ├── schema.prisma   # Database models
│   │   └── migrations/     # Migration history
│   ├── routes/              # API routes
│   │   ├── userRoutes.ts
│   │   └── projectRoutes.ts
│   ├── types/               # TypeScript type definitions
│   │   └── express.d.ts
│   ├── server.ts            # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json          # Vercel deployment config
│
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── assets/         # Images, fonts, etc.
│   │   ├── components/     # React components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── ProjectPreview.tsx
│   │   │   └── ...
│   │   ├── configs/        # Configuration
│   │   │   └── axios.ts   # HTTP client setup
│   │   ├── lib/           # Utilities
│   │   │   ├── auth-client.ts
│   │   │   └── utils.ts
│   │   ├── pages/         # Route pages
│   │   │   ├── Home.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── MyProjects.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── ...
│   │   ├── types/         # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx        # Main app component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── .gitignore
└── README.md
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### Better Auth
All authentication is handled through Better Auth:

```
POST   /api/auth/sign-up          # Create account
POST   /api/auth/sign-in          # Login
POST   /api/auth/sign-out         # Logout
GET    /api/auth/session          # Get current session
```

### User Endpoints

All user endpoints require authentication.

#### Get User Credits
```http
GET /api/user/credits
```

**Response**:
```json
{
  "credits": 15
}
```

#### Create New Project
```http
POST /api/user/project
Content-Type: application/json

{
  "initial_prompt": "Create a modern landing page for a SaaS product"
}
```

**Response**:
```json
{
  "projectId": "uuid-here"
}
```

#### Get Single Project
```http
GET /api/user/project/:projectId
```

**Response**:
```json
{
  "project": {
    "id": "uuid",
    "name": "Project Name",
    "current_code": "<html>...</html>",
    "conversation": [...],
    "versions": [...],
    "isPublished": false
  }
}
```

#### Get All Projects
```http
GET /api/user/projects
```

#### Toggle Publish Status
```http
GET /api/user/publish-toggle/:projectId
```

#### Purchase Credits
```http
POST /api/user/purchase-credits
Content-Type: application/json

{
  "planId": "basic" | "pro" | "enterprice"
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### Project Endpoints

All project endpoints require authentication.

#### Make Revision
```http
POST /api/project/revision/:projectId
Content-Type: application/json

{
  "message": "Make the header blue and add a contact form"
}
```

#### Save Project Code
```http
PUT /api/project/save/:projectId
Content-Type: application/json

{
  "code": "<html>...</html>"
}
```

#### Rollback to Version
```http
GET /api/project/rollback/:projectId/:versionId
```

#### Delete Project
```http
DELETE /api/project/:projectId
```

#### Get Project Preview
```http
GET /api/project/preview/:projectId
```

#### Get Published Projects (Public)
```http
GET /api/project/published
```

#### Get Published Project by ID (Public)
```http
GET /api/project/published/:projectId
```

### Webhook Endpoint

#### Stripe Webhook
```http
POST /api/stripe
Content-Type: application/json
Stripe-Signature: <signature>
```

---

## 🗄 Database Schema

### Models

```prisma
model User {
  id            String
  email         String
  name          String
  totalCreation Int    @default(0)
  credits       Int    @default(20)
  emailVerified Boolean @default(false)
  
  projects      WebsiteProject[]
  sessions      Session[]
  accounts      Account[]
  transactions  Transaction[]
}

model WebsiteProject {
  id                    String
  name                  String
  initial_prompt        String
  current_code          String?
  current_version_index String  @default("")
  userId                String
  isPublished           Boolean @default(false)
  
  conversation Conversation[]
  versions     Version[]
  user         User
}

model Conversation {
  id        String
  role      Role     (user | assistant)
  content   String
  timestamp DateTime @default(now())
  projectId String
  
  project WebsiteProject
}

model Version {
  id          String
  code        String
  description String?
  timestamp   DateTime @default(now())
  projectId   String
  
  project WebsiteProject
}

model Transaction {
  id        String
  isPaid    Boolean  @default(false)
  planId    String
  amount    Float
  credits   Int
  userId    String
  
  user User
}
```

---

## 🚢 Deployment

### Deploy to Vercel

#### Prerequisites
- GitHub account with your code pushed
- Vercel account
- Production database (Neon recommended)

#### Step 1: Deploy Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Configure**:
   - Framework: Other
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

4. **Add Environment Variables**:
   ```
   DATABASE_URL=<your-neon-production-url>
   BETTER_AUTH_SECRET=<generate-new-secret>
   BETTER_AUTH_URL=https://your-backend.vercel.app
   TRUSTED_ORIGINS=https://your-frontend.vercel.app
   NODE_ENV=production
   AI_API_KEY=<your-openrouter-key>
   STRIPE_SECRET_KEY=<your-stripe-key>
   STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
   ```

5. Click **Deploy**

#### Step 2: Deploy Frontend

1. Add new project in Vercel
2. Import same repository
3. **Configure**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variable**:
   ```
   VITE_BASEURL=https://your-backend.vercel.app
   ```

5. Click **Deploy**

#### Step 3: Update Environment Variables

After both deployments:

1. Go to backend project settings
2. Update `TRUSTED_ORIGINS` with actual frontend URL
3. Update `BETTER_AUTH_URL` with actual backend URL
4. Redeploy backend

#### Step 4: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-backend.vercel.app/api/stripe`
3. Select events: `payment_intent.succeeded`
4. Copy signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel
6. Redeploy backend

### Database Migrations

Run migrations on production database:

```bash
# Set production database URL
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] Sign up / Sign in
- [ ] Create new project
- [ ] AI generates website
- [ ] Make revision
- [ ] Save changes
- [ ] Rollback to version
- [ ] Publish/unpublish
- [ ] Download code
- [ ] Purchase credits
- [ ] Credits added after payment

---

## 🔒 Security

### Best Practices Implemented

- ✅ **Authentication**: Session-based with httpOnly cookies
- ✅ **Authorization**: All protected endpoints verify user identity
- ✅ **CORS**: Restricted to trusted origins
- ✅ **Environment Variables**: Secrets never committed to Git
- ✅ **SQL Injection**: Protected by Prisma ORM
- ✅ **XSS Protection**: React automatic escaping
- ✅ **Webhook Verification**: Stripe signature validation
- ✅ **HTTPS**: Required in production
- ✅ **Rate Limiting**: (Recommended for production)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Update documentation for new features
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Alok Kumar**

- GitHub: [@iamalok123](https://github.com/iamalok123)
- Repository: [Zephyr AI Website Builder](https://github.com/iamalok123/zephyr-ai-website-builder)

---

## 🙏 Acknowledgments

- [Better Auth](https://github.com/better-auth/better-auth) - Authentication solution
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Vercel](https://vercel.com/) - Deployment platform
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [OpenRouter](https://openrouter.ai/) - AI API gateway
- [Stripe](https://stripe.com/) - Payment processing
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

##  Support

If you have any questions or need help, please:

1. Check the [documentation](#-api-documentation)
2. Search existing [issues](https://github.com/iamalok123/zephyr-ai-website-builder/issues)
3. Open a new issue if needed

---

## 🗺 Roadmap

### Upcoming Features

- [ ] **Custom Domains**: Connect your own domain
- [ ] **Templates Library**: Pre-built website templates
- [ ] **Component Library**: Reusable UI components
- [ ] **Team Collaboration**: Share projects with team members
- [ ] **Version Comparison**: Visual diff between versions
- [ ] **Export Options**: PDF, PNG screenshots
- [ ] **AI Models**: Support for multiple AI models
- [ ] **Code Editor**: In-browser IDE with syntax highlighting
- [ ] **SEO Tools**: Meta tags, sitemap generation
- [ ] **Analytics**: Track website performance

---

<div align="center">

**⚡ Zephyr - Built with ❤️ using React, Node.js, PostgreSQL, and AI**

*Transforming ideas into reality, one prompt at a time.*

[⬆ Back to Top](#-zephyr---ai-powered-website-builder)

</div>
