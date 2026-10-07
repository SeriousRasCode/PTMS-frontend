# 🚀 DEBO PTMS Frontend

A modern React + Vite frontend for the DEBO PTMS platform, built for role-based project management, task tracking, team coordination, and reporting in a clean dashboard experience.

<div align="center">

![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss)
![MUI](https://img.shields.io/badge/MUI-7.x-007FFF?style=for-the-badge&logo=mui)

</div>

## ✨ Overview

This frontend application provides the web interface for the DEBO PTMS system. It includes authentication, protected dashboards, role-driven navigation, project and task management pages, settings, and reporting modules.

The platform is built for different user groups:

- 👑 Admin
- 🧭 Manager
- 👷 Member

Each role sees a tailored experience across the same product.

## 🧩 Project Structure

```text
frontend_ptms/
├── README.md
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── postcss.config.mjs
├── index.html
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── main.tsx
│   └── styles/
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
└── test-backend.html
```

## 🛠️ Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- MUI / Emotion
- Radix UI primitives
- React Router
- TanStack Query
- Recharts
- Framer Motion / motion
- Sonner notifications
- react-hook-form + validation patterns

## 🎯 Features

- Secure login and registration flow
- Password reset and recovery screens
- Protected route handling
- Dynamic role-based dashboards
- Project listing and project detail screens
- Tasks and team views
- Reports and profile management
- Responsive UI for desktop and browser environments
- UI patterns and reusable design system components

## ▶️ Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A running backend/API service for real data

### Install dependencies

```bash
cd frontend_ptms
npm install
```

### Run locally

```bash
npm run dev
```

The app will start in development mode and open the Vite local URL in your browser.

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## ⚙️ Configuration

This project uses Vite and is configured for a browser deployment setup. The root deployment configuration is managed in the project-level Netlify file:

- [netlify.toml](../netlify.toml)

The build is configured to publish the generated `dist` folder.

## 🧭 Routing

The frontend uses React Router with route groups for:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/dashboard/admin`
- `/dashboard/manager`
- `/dashboard/member`
- `/dashboard/projects`
- `/dashboard/tasks`
- `/dashboard/teams`
- `/dashboard/reports`
- `/dashboard/profile`

Protected routes ensure only authorized users can access role-specific screens.

## 📦 Scripts

```bash
npm run dev
npm run build
npm run preview
```

## 🚀 Deployment

This frontend is prepared for Netlify deployment through the repository config.

```bash
npm run build
```

Then the built `dist` output can be uploaded or deployed through Netlify.

## 🤝 Contribution

Contributions are welcome. Please keep the codebase consistent with the existing design system and role-based navigation patterns.

## 📜 Notes

- The frontend is designed to work with a backend API for real project and user data.
- Some screens are prepared for role-based logic and route protection.
- The app is highly UI-focused and may require API integration for full production behavior.

---

Built for a modern team project workflow.
