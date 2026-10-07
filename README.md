# 🚀 DEBO PTMS

A modern Project and Task Management System built for collaborative teams, role-based project oversight, and streamlined work execution across web and mobile platforms.

<div align="center">

![Flutter](https://img.shields.io/badge/Flutter-3.10-02569B?style=for-the-badge&logo=flutter)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)

</div>

## ✨ Overview

DEBO PTMS is a full-stack-inspired front-end monorepo that combines two client applications:

- a responsive web dashboard built with React, Vite, TypeScript, and Material UI
- a Flutter application for mobile and cross-platform project management

The platform is designed to support different user roles including Admin, Manager, and Member, with dashboards and workflows tailored to each role.

## 🧩 Project Structure

```text
deboFrontend1/
├── README.md
├── netlify.toml
├── frontend_ptms/           # React + Vite + TypeScript web app
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
├── mobile_ptms/             # Flutter mobile/web app
│   ├── lib/
│   ├── assets/
│   ├── android/
│   ├── ios/
│   ├── web/
│   ├── pubspec.yaml
│   └── analysis_options.yaml
└── .gitignore
```

## 🧠 Core Features

### 📊 Role-based dashboards

- Admin dashboard with team and user monitoring
- Manager dashboard for project oversight and delivery tracking
- Member dashboard focused on assigned work and daily task progress

### 🗂️ Project management

- Project listing and detail views
- Task tracking and assignment management
- Team-based collaboration structure
- Reporting flows for status monitoring

### 🔐 Authentication and access control

- Login, registration, password reset, and recovery flows
- Protected routes based on user role
- Token-aware session handling in the Flutter app

### 📱 Multi-platform delivery

- Web client for desktop/browser users
- Flutter client for mobile and cross-platform experiences
- Shared product logic and role-driven experience across clients

## 🛠️ Technology Stack

### Web Application (`frontend_ptms/`)

- React 19
- TypeScript
- Vite
- Tailwind CSS
- MUI + custom design system
- Radix UI primitives
- TanStack Query for data fetching
- React Router for navigation
- Recharts and other UI/charting libraries

### Mobile Application (`mobile_ptms/`)

- Flutter
- Dart
- Bloc state management
- Dio for network requests
- SharedPreferences for local token persistence
- Material Design UI

## 📁 App Responsibilities

### `frontend_ptms/`

This is the browser-first experience for the product. It includes:

- authentication pages
- protected dashboard routes
- project and task screens
- reports and profile views
- role-based navigation shells

### `mobile_ptms/`

This is the Flutter implementation of the same product idea for native-like mobile/web experiences, with:

- authentication flow
- role-aware home navigation
- project and task pages
- profile management
- API integration through a centralized client

## 🚀 Getting Started

### Prerequisites

Before running the apps, make sure you have the following installed:

- Node.js 18+ and npm or pnpm
- Flutter SDK 3.10+
- Android Studio / Xcode for native builds (optional)
- A working backend/API service if your project connects to a real server

### 1) Clone the repository

```bash
git clone <repository-url>
cd deboFrontend1
```

### 2) Run the React web app

```bash
cd frontend_ptms
npm install
npm run dev
```

Then open the local Vite URL in your browser.

### 3) Run the Flutter app

```bash
cd mobile_ptms
flutter pub get
flutter run
```

For web preview in Flutter:

```bash
flutter run -d chrome
```

## ⚙️ Configuration

The Flutter app uses a base URL defined in `mobile_ptms/lib/core/constants/api_constants.dart`.

By default, it points to local development endpoints:

- Web: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`

You can override it using a Dart compile-time environment value:

```bash
flutter run --dart-define=BASE_URL=http://your-api-url
```

The web app is configured for Netlify deployment via `netlify.toml` and builds from the `frontend_ptms` directory.

## 🏗️ Deployment

This repository includes Netlify configuration for the React web app:

- build directory: `frontend_ptms/dist`
- base directory: `frontend_ptms`
- SPA redirect rule handled via `index.html`

Example deployment flow:

```bash
cd frontend_ptms
npm run build
```

Then publish the generated `dist` folder to Netlify or push the repository to a connected Netlify project.

## 📦 Available Scripts

### React app

```bash
npm run dev     # start local development server
npm run build   # create production build
npm run preview # preview production build locally
```

### Flutter app

```bash
flutter pub get    # install dependencies
flutter analyze    # run static analysis
flutter test       # execute tests
flutter run        # launch app on selected device
```

## 👥 User Roles

The system is organized around a role-based workflow:

- 👑 Admin — system oversight, team/user administration, high-level reporting
- 🧭 Manager — project coordination, progress monitoring, assignment oversight
- 👷 Member — task execution, personal work tracking, project contribution

## 🔒 Notes

- Token/session handling is implemented in the Flutter app using local persistence.
- The project is front-end oriented and expects a backend or API service for full production use.
- Production security, validation, and API integration should be hardened before live deployment.

## 🤝 Contributors

This project was developed and contributed by:

- 👤 Shambel Dechu
- 👤 Tedros Teshome
- 👤 Bonsa Adugna

We welcome contributions from others as well. If you plan to improve features, fix routing issues, add tests, or enhance the dashboard experience, please:

1. fork the repository
2. create a feature branch
3. commit your changes clearly
4. open a pull request with a concise summary

## 📜 License

This project does not currently declare a license file in the repository. If you plan to publish or distribute it externally, add an appropriate license before release.

---

Built for managing projects, teams, and tasks efficiently.
