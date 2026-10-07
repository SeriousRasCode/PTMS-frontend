# 📱 DEBO PTMS Mobile App

A Flutter-based mobile and cross-platform client for the DEBO PTMS project management system, built for on-the-go team coordination, project oversight, and task management.

<div align="center">

![Flutter](https://img.shields.io/badge/Flutter-3.10-02569B?style=for-the-badge&logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?style=for-the-badge&logo=dart)
![Bloc](https://img.shields.io/badge/Bloc-State%20Management-6A5ACD?style=for-the-badge&logo=flutter)
![Material](https://img.shields.io/badge/Material-Design-2196F3?style=for-the-badge&logo=materialdesign)

</div>

## ✨ Overview

This application is the mobile implementation of the DEBO PTMS ecosystem. It provides a clean, role-aware experience for managers, admins, and team members to manage projects, tasks, and personal profiles.

The app uses Flutter with BLoC for state management, token-based authentication, and centralized API integration through a reusable client layer.

## 🧩 Project Structure

```text
debo_ptms/
├── README.md
├── analysis_options.yaml
├── pubspec.yaml
├── android/
├── ios/
├── web/
├── windows/
├── assets/
│   └── images/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── constants/
│   │   ├── error/
│   │   ├── network/
│   │   ├── storage/
│   │   └── theme/
│   ├── features/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── home/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── user/
│   └── shared/
│       └── widgets/
└── test/
```

## 🛠️ Stack

- Flutter
- Dart
- Bloc / Cubit-style state handling
- Dio for HTTP requests
- SharedPreferences for persistent storage
- Material Design components
- Custom theme and color configuration

## 🎯 Features

- User authentication and onboarding
- Login, signup, and registration flow
- Role-based home and dashboard navigation
- Project list and detailed screens
- Task management views
- Profile handling and user state updates
- Secure token persistence
- Responsive interface for mobile and web Flutter targets

## ▶️ Getting Started

### Prerequisites

- Flutter SDK 3.10+
- Android Studio or Xcode for native builds
- VS Code or Android Studio for development
- A running backend/server for API communication

### Install dependencies

```bash
cd debo_ptms
flutter pub get
```

### Run the app

```bash
flutter run
```

### Run in web mode

```bash
flutter run -d chrome
```

## ⚙️ Configuration

The mobile app reads its backend base URL from:

- `lib/core/constants/api_constants.dart`

By default, it uses local development endpoints:

- Web: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`

You can override it using:

```bash
flutter run --dart-define=BASE_URL=http://your-api-url
```

## 🧠 App Behavior

The app boots through `main.dart` and initializes:

- token storage
- API client
- user repository
- authentication bloc

It then routes the user into an auth gate that decides whether to show login or the home/dashboard flow based on authentication status.

## 👥 Role-Based Navigation

The application is designed around role-aware screens:

- 👑 Admin — broader dashboard and management views
- 🧭 Manager — project coordination and monitoring
- 👷 Member — task and project contribution experience

## 🧪 Useful Commands

```bash
flutter analyze
flutter test
flutter run
flutter build apk
flutter build ios
```

## 🔒 Notes

- Auth session handling is persisted locally with `shared_preferences`.
- This app is front-end focused and assumes backend API support for production usage.
- Security, validation, and production deployment should be tightened before live release.

## 🤝 Contribution

Contributions are welcome. Please keep the mobile UI, architecture, and role-aware logic consistent with the project’s existing patterns.

---

Built for streamlined mobile project and task management.
