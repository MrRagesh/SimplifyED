# SimplifyED 🚀

SimplifyED is a full-stack, AI-powered educational platform designed to simplify learning through interactive AI tutoring, intelligent chat interfaces, and automated quiz generation. Built for students and educators, it provides a seamless learning experience by breaking down complex topics into digestible content.

## 📖 Table of Contents
- [Features](#-features)
- [System Architecture](#️-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [API Integrations](#-api-integrations)
- [Local Setup Guide](#-local-setup-guide)
- [Deployment Guide](#-deployment-guide)
- [License](#-license)

---

## ✨ Features
- **AI-Powered Tutoring:** Real-time conversational AI to help students understand complex topics.
- **Automated Quiz Generation:** Dynamically generate quizzes based on learning material using LLMs.
- **Interactive Dashboard:** A clean, modern UI for tracking progress and managing study materials.
- **Secure Authentication:** Built-in local and third-party authentication capabilities (Replit Auth fallback).
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewing.

---

## 🏗️ System Architecture

The project follows a standard modern Client-Server App Service architecture, split between a single-page React frontend and a Node.js Express backend communicating via REST/React Query. 

```mermaid
graph TD
    User([🎓 User / Student]) -->|Interacts| Client[💻 React Frontend Vite]
    
    subgraph Frontend [Client - React / Vite]
        UI[UI Components radix-ui/tailwind]
        State[State Management React Query/wouter]
        Pages[Pages Dashboard, Chat, Quiz]
        UI --> State
        State --> Pages
    end

    Client <-->|REST API + WebSockets| Server[⚙️ Node.js Express Server]

    subgraph Backend [Backend - Express / SQLite-Postgres]
        Routes[API Routes /api/*]
        Auth[Authentication Passport.js]
        DB[Database Drizzle ORM]
        Routes --> Auth
        Auth --> DB
    end

    subgraph External Services
        AI[🧠 OpenRouter AI NVIDIA Nemotron]
        ExtDB[(☁️ PostgreSQL Database Neon)]
    end

    Server <-->|Queries| AI
    DB <-->|Read / Write| ExtDB
```

---

## 💻 Technology Stack

SimplifyED is built using top-tier, modern open-source web technologies.

### Frontend
* **Core Framework:** React 18, Vite
* **Routing:** `wouter` (Lightweight React Router alternative)
* **Styling & UI Components:** 
  * Tailwind CSS (Utility-first styling)
  * `radix-ui` (Headless UI components)
  * `lucide-react` (SVG icons)
  * `framer-motion` (Animations)
* **State Management & Data Fetching:** `@tanstack/react-query`
* **Markdown Rendering:** `react-markdown`, `remark-gfm`

### Backend
* **Core Framework:** Node.js, Express.js
* **Database & ORM:** PostgreSQL, `drizzle-orm`
* **Authentication:** `passport.js` (Local auth & Replit OAuth)
* **Session Management:** `express-session`, `connect-pg-simple`
* **Validation:** `zod`

---

## 🛠️ Project Structure

The codebase is organized as a monorepo setup handling both the frontend and backend in one directory structure.

```text
SimplifyED/
│
├── client/                 # React Frontend Application
│   ├── index.html          # Vite Entry Point
│   └── src/
│       ├── components/     # Reusable React UI Components (radix/tailwind)
│       ├── hooks/          # Custom Hooks (use-toast, use-auth, etc.)
│       ├── lib/            # Utility functions and API query clients
│       └── pages/          # Full page views (Dashboard, Chat, Quiz, Landing)
│
├── server/                 # Node.js/Express Backend
│   ├── index.ts            # Server Entry Point (Port listener setup)
│   ├── routes.ts           # All API endpoint definitions
│   ├── db.ts               # Database connection configuration
│   ├── lib/                # Backend Libs (e.g. ai_service.ts for OpenRouter)
│   └── replit_integrations/# Authentication logic layer
│
├── shared/                 # Shared Code between Front/Back
│   └── schema.ts           # Drizzle Database Schemas & Zod Types
│
├── package.json            # Node Dependencies & NPM Scripts
├── vite.config.ts          # Vite Bundler Configuration
├── tailwind.config.ts      # Tailwind Styling Configuration
└── drizzle.config.ts       # Drizzle Database connection script
```

---

## 🔌 API Integrations

### 1. OpenRouter (NVIDIA Nemotron 30b)
Provides the core intelligence for the platform.
* **Usage:** Used in `server/lib/ai_service.ts` to power the `generateHybridResponse` (tutoring chat) and `generateHybridQuiz` (dynamic test generation).
* **Model Used:** `nvidia/nemotron-3-nano-30b-a3b:free`
* **Requirement:** Needs `OPENROUTER_API_KEY` defined in environment variables.

### 2. PostgreSQL (Database)
The primary data lake for users, chat histories, and quiz scores. 
* **Integration:** Controlled via Drizzle ORM pushing schemas to the Cloud or Local Postgres server.
* **Requirement:** Needs `DATABASE_URL` defined in environment variables.

---

## 🚀 Local Setup Guide

Follow these steps to run SimplifyED locally on your machine.

### Prerequisites
* **Node.js:** v18 or later.
* **NPM / Bun / Yarn:** Standard package managers.
* **Desktop PostgreSQL:** Or a free cloud database like [Neon.tech](https://neon.tech/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SimplifyED.git
   cd SimplifyED
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the directory and add your credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/simplify_db
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   SESSION_SECRET=a_super_secret_session_string
   ```

4. **Initialize the Database:**
   Push the schema to your database to create the required tables:
   ```bash
   npm run db:push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will boot up at `http://localhost:5000`.

---

## 🌍 Deployment Guide

If you wish to deploy this project live **for free** (using Render + Neon), please consult the dedicated deployment guide:
👉 **[View the Deployment Guide](./DEPLOYMENT_GUIDE.md)**

---

## 📄 License
This project is licensed under the [MIT License](./package.json).
