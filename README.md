# 🚀 Zivro AI Website Builder

A modern, full-stack AI-powered website builder that empowers users to create, manage, and publish professional websites through conversational AI interactions. Built with cutting-edge technologies and designed for scalability and user experience.

**Live Demo:** [Zivro AI Website Builder](https://zivro-ai-websites-buider.vercel.app)

## 🎯 Overview

**Zivro AI Website Builder** is a sophisticated SaaS platform that democratizes web development by combining AI-powered code generation with an intuitive user interface. Users can describe their website requirements in natural language, and our AI engine generates production-ready HTML/CSS code with Tailwind CSS styling.

### Key Differentiators:

- **AI-Powered Generation:** Uses OpenAI's API to enhance user prompts and generate website code
- **Version Control:** Track all changes with complete rollback capability
- **Credit-Based System:** Sustainable monetization through a token-based credit system
- **Community Features:** Share and discover websites built by other users
- **Professional Hosting:** Deploy with SEO optimization and sitemap support

---

## ✨ Key Features

### Core Features

- ✅ **AI Website Generation** - Describe your site, let AI build it
- ✅ **Visual Editor** - Real-time preview and manual code editing
- ✅ **Version Control** - Full revision history with one-click rollback
- ✅ **Multi-Project Support** - Manage unlimited website projects
- ✅ **Project Publishing** - Share websites with custom public URLs
- ✅ **Community Showcase** - Browse and discover published projects

### User Management

- 🔐 **Secure Authentication** - Better-auth with session management
- 👤 **User Accounts** - Profile management and account settings
- 💰 **Credit System** - Pay-as-you-build model (5 credits per AI revision)
- 📊 **Usage Tracking** - Monitor credit consumption and project activity

### Premium Features

- 💳 **Pricing Plans** - Tiered credit packages for different needs
- 🎨 **Custom Theming** - Tailwind CSS-based styling system
- 📱 **Responsive Design** - Mobile-first design patterns
- 🔍 **SEO Optimization** - Automatic sitemap generation and meta tags

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  - Vite Build System                                            │
│  - React Router (Page Navigation)                               │
│  - Tailwind CSS (Styling)                                       │
│  - Better-Auth UI (Authentication)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend (Node.js/Express)                    │
│  - Express Server (Port 5000)                                   │
│  - Better-Auth (Authentication Middleware)                      │
│  - CORS Protection                                              │
│  - Route Handlers (User & Project APIs)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQL Queries
┌────────────────────────────▼────────────────────────────────────┐
│                    Data Layer (Prisma ORM)                      │
│  - Schema Definition                                            │
│  - Migration Management                                         │
│  - Query Building                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ Native Protocol
┌────────────────────────────▼────────────────────────────────────┐
│              Database (PostgreSQL)                              │
│  - Users, Projects, Versions, Conversations, Sessions          │
│  - Transactions, Accounts (OAuth)                               │
└─────────────────────────────────────────────────────────────────┘
                             │
                    External Services
                             │
                    ┌────────┴─────────┐
                    │                  │
            ┌───────▼──────┐   ┌──────▼────────┐
            │  OpenAI API  │   │  Better-Auth  │
            │ (Code Gen)   │   │   OAuth/JWT   │
            └──────────────┘   └───────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology          | Purpose                       |
| ------------------- | ----------------------------- |
| **React 19**        | UI Framework with hooks       |
| **TypeScript**      | Type safety and IDE support   |
| **Vite**            | Lightning-fast build tool     |
| **React Router v7** | Client-side routing           |
| **Tailwind CSS v4** | Utility-first styling         |
| **Axios**           | HTTP client with interceptors |
| **Better-Auth UI**  | Pre-built auth components     |
| **Sonner**          | Toast notifications           |
| **Lucide Icons**    | SVG icon library              |

### Backend

| Technology        | Purpose                   |
| ----------------- | ------------------------- |
| **Node.js**       | Runtime environment       |
| **Express v5**    | Web framework             |
| **TypeScript**    | Type safety               |
| **Prisma v7**     | ORM & database toolkit    |
| **PostgreSQL**    | Primary database          |
| **Better-Auth**   | Authentication middleware |
| **OpenAI SDK v6** | AI code generation        |
| **CORS**          | Cross-origin requests     |

### DevOps & Deployment

| Technology             | Purpose                     |
| ---------------------- | --------------------------- |
| **Vercel**             | Frontend hosting & CDN      |
| **PostgreSQL (Cloud)** | Managed database            |
| **Docker**             | Containerization (optional) |
| **Nodemon**            | Dev server auto-reload      |

---

## 📁 Project Structure

```
Site Builder/
├── Client/                          # React Frontend Application
│   ├── src/
│   │   ├── Pages/                  # Page components
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Projects.tsx        # Editor/Builder page
│   │   │   ├── MyProjects.tsx      # User's projects list
│   │   │   ├── Preview.tsx         # Project preview
│   │   │   ├── View.tsx            # Public project viewer
│   │   │   ├── Community.tsx       # Published projects showcase
│   │   │   ├── Pricing.tsx         # Credit packages
│   │   │   ├── Settings.tsx        # Account settings
│   │   │   └── Auth/AuthPage.tsx   # Login/Register
│   │   ├── Components/             # Reusable components
│   │   │   ├── Navbar.tsx          # Top navigation
│   │   │   ├── Sidebar.tsx         # Side panel
│   │   │   ├── EditorPanel.tsx     # Code editor
│   │   │   ├── ProjectPreview.tsx  # Project card
│   │   │   ├── Footer.tsx          # Footer
│   │   │   └── LoaderSteps.tsx     # Progress indicator
│   │   ├── Config/
│   │   │   └── axios.ts            # API client config
│   │   ├── lib/
│   │   │   ├── auth-client.ts      # Auth utilities
│   │   │   └── utils.ts            # Helper functions
│   │   ├── Types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── Assets/
│   │   │   └── dummyProjects.ts    # Mock data
│   │   ├── App.tsx                 # Root component
│   │   ├── main.tsx                # Entry point
│   │   └── providers.tsx           # Context providers
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── components.json             # Component library config
│   └── package.json
│
├── Server/                         # Express Backend Application
│   ├── Controllers/                # Business logic
│   │   ├── projectController.ts   # Project operations
│   │   └── userController.ts      # User operations
│   ├── routes/                     # API routes
│   │   ├── projectRoutes.ts       # /api/project routes
│   │   └── userRoutes.ts          # /api/user routes
│   ├── Middlewares/
│   │   └── authMiddleware.ts      # JWT/Session validation
│   ├── Config/
│   │   └── OpenAI.ts              # OpenAI client setup
│   ├── lib/
│   │   ├── auth.ts                # Better-auth config
│   │   ├── prisma.ts              # Prisma client
│   │   └── expressType.ts         # Express type extensions
│   ├── Types/
│   │   └── expressType.ts         # Custom Express types
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # DB migrations
│   ├── generated/                  # Auto-generated Prisma types
│   ├── server.ts                   # Express app setup & startup
│   ├── prisma.config.ts           # Prisma configuration
│   └── package.json
│
├── README.md                       # This file
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ (v20+ recommended)
- **npm** v9+ or **yarn** v3+
- **Git**
- **PostgreSQL** v13+ (local or cloud: PostgreSQL at Vercel, Railway, or AWS RDS)

### Environment Setup

#### 1. Backend Environment Variables (Server/.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zivro_db"

# Server
PORT=5000
NODE_ENV=development

# CORS
TRUSTED_ORIGINS="http://localhost:5173,http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Better-Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:5000"

```

#### 2. Frontend Environment Variables (Client/.env)

```bash
VITE_BASEURL="http://localhost:5000"
VITE_APP_URL="http://localhost:5173"
```

### Installation

#### Step 1: Clone Repository

```bash
git clone https://github.com/priyanshu-soyal/Zivro-Ai_Website_Builder.git
cd "Site Builder"
```

#### Step 2: Install Backend Dependencies

```bash
cd Server
npm install

# Setup Prisma
npx prisma generate
npx prisma migrate dev --name init
```

#### Step 3: Install Frontend Dependencies

```bash
cd ../Client
npm install
```

### Running Locally

#### Terminal 1 - Start Backend Server

```bash
cd Server
npm run server
# Server runs on http://localhost:5000
```

#### Terminal 2 - Start Frontend Dev Server

```bash
cd Client
npm run dev
# Frontend runs on http://localhost:5173 (or shows in terminal)
```

#### Terminal 3 - (Optional) Monitor Database

```bash
cd Server
npx prisma studio
# Opens database UI at http://localhost:5555
```

---

## 🔧 Core Functionality

### 1. Website Project Lifecycle

```
CREATE PROJECT → EDIT (AI) → PREVIEW → VERSION CONTROL → PUBLISH → SHARE
```

### 2. AI-Powered Revision Process

1. **User Input**: "Add a dark theme toggle to my landing page"
2. **Prompt Enhancement**: AI expands the request with design details
3. **Code Generation**: OpenAI generates complete updated HTML/Tailwind CSS
4. **Version Creation**: New version saved to database
5. **Conversation Log**: Interaction logged for context
6. **Credit Deduction**: 5 credits charged from user account

### 3. Version Control System

- Every project modification creates a new `Version` record
- Users can preview any historical version
- One-click rollback to previous versions
- Full audit trail of changes

### 4. Project Publishing

- Private projects (default) - Only owner can view
- Published projects - Public URL and visible in Community
- Public view endpoint protects unpublished projects
- SEO-friendly URLs and meta tags

---

## 📡 API Endpoints

### Authentication Routes

```
POST   /api/auth/*             Better-Auth endpoints (OAuth, JWT, Sessions)
```

### Project Routes

```
POST   /api/project/create      Create new project
GET    /api/project/:id         Get project details
PUT    /api/project/:id         Update project
DELETE /api/project/:id         Delete project

POST   /api/project/:id/revise       Make AI-powered changes
GET    /api/project/:id/preview      Get project code for preview
POST   /api/project/:id/rollback/:versionId  Rollback to version

POST   /api/project/:id/publish      Publish project
GET    /api/project/published        Get all published projects
GET    /api/project/view/:id         View public project
```

### User Routes

```
GET    /api/user/profile       Get current user profile
PUT    /api/user/profile       Update user info
GET    /api/user/credits       Check credit balance
POST   /api/user/buy-credits   Purchase credits
GET    /api/user/projects      Get user's projects
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE User (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  image VARCHAR,
  credits INT DEFAULT 10,
  emailVerified BOOLEAN,
  createdAt TIMESTAMP
);

-- Website Projects
CREATE TABLE WebsiteProject (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL REFERENCES User(id),
  name VARCHAR NOT NULL,
  description TEXT,
  current_code TEXT,
  current_version_index VARCHAR,
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Project Versions
CREATE TABLE Version (
  id VARCHAR PRIMARY KEY,
  projectId VARCHAR NOT NULL REFERENCES WebsiteProject(id),
  code TEXT NOT NULL,
  description VARCHAR,
  createdAt TIMESTAMP
);

-- Conversation History
CREATE TABLE Conversation (
  id VARCHAR PRIMARY KEY,
  projectId VARCHAR NOT NULL REFERENCES WebsiteProject(id),
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP
);

-- Transactions (Credits)
CREATE TABLE Transaction (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL REFERENCES User(id),
  type ENUM('purchase', 'usage'),
  amount INT,
  createdAt TIMESTAMP
);

-- Authentication
CREATE TABLE Session (id, userId, expiresAt, ...);
CREATE TABLE Account (provider, providerAccountId, ...);
CREATE TABLE Verification (identifier, token, expires, ...);
```

---

## 🔐 Authentication

### Better-Auth Integration

- **Providers**: Email/Password, OAuth (Google, GitHub)
- **Sessions**: JWT tokens with 30-day expiry
- **Middleware**: `authMiddleware.ts` validates requests
- **Credentials**: Stored securely with hashing

### Request Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 💳 Credit System

### Credit Usage

- **Initial Credits**: 10 credits on signup
- **Cost per Revision**: 5 credits (AI-powered changes)
- **Refund on Error**: Credits refunded if generation fails
- **Unlimited**: Preview, rollback, and publishing

### Purchase Tiers

- **Starter**: 50 credits ($9.99)
- **Pro**: 200 credits ($29.99)
- **Enterprise**: Custom quotes

---

## 🌐 Deployment

### Frontend (Vercel)

```bash
# Automatic deployment from main branch
npm run build
# Outputs to Client/dist/
```

**Environment Variables (Vercel):**

- `VITE_BASEURL`: Backend API URL
- `VITE_APP_URL`: Frontend URL

### Backend (Cloud Provider: Railway/Render/Heroku)

#### Using Railway:

```bash
# Push to repo → Railway auto-deploys
# Set environment variables in Railway dashboard
```

#### Using Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

### Database (PostgreSQL Cloud)

- **Railway**: Auto-provisioned
- **Vercel Postgres**: Vercel integration
- **AWS RDS**: Self-managed
- **Render**: Managed PostgreSQL

### SEO & Sitemap

- Automatic sitemap generation at `/sitemap.xml`
- Submit to Google Search Console
- Meta tags for Open Graph sharing
- Structured data for rich snippets

---

## 🧪 Development Workflow

### Code Style & Linting

```bash
# Frontend linting
cd Client
npm run lint

# Fix linting issues
npm run lint -- --fix
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# View changes
npx prisma studio
```

### Building for Production

```bash
# Frontend
cd Client
npm run build

# Backend
cd Server
npm run build
```

---

## 🤝 Contributing

We welcome contributions! Follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request with description

### Code Standards

- Follow existing code style
- Use TypeScript for type safety
- Add comments for complex logic
- Test features before submitting PR
- Update README if adding features

---

## 📊 Project Statistics

- **Total Pages**: 8+ (Home, Editor, Preview, Community, Pricing, Settings, Auth)
- **API Endpoints**: 15+
- **Database Tables**: 7
- **Components**: 20+
- **Lines of Code**: 5000+

---

## 🔗 Useful Links

- **GitHub**: [Zivro AI Website Builder](https://github.com/priyanshu-soyal/Zivro-Ai_Website_Builder)
- **Live Demo**: [zivro-ai-websites-buider.vercel.app](https://zivro-ai-websites-buider.vercel.app)
- **OpenAI Docs**: [OpenAI API Reference](https://platform.openai.com/docs)
- **Prisma Docs**: [Prisma ORM](https://www.prisma.io/docs)
- **Better-Auth Docs**: [Better-Auth](https://www.better-auth.com)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Priyanshu Soyal**

- GitHub: [@priyanshu-soyal](https://github.com/priyanshu-soyal)
- Email: priyanshusoyal@example.com

---

## 🙏 Acknowledgments

- **OpenAI** for powerful AI models
- **Vercel** for hosting and deployment platform
- **Prisma** for excellent ORM
- **Better-Auth** for authentication solution
- **React** and **Node.js** communities

---

**Last Updated**: 2026-05-10 | **Version**: 2.0.0

For issues, bug reports, or feature requests, please [open an issue](https://github.com/priyanshu-soyal/Zivro-Ai_Website_Builder/issues).
