# Tasbih Digital

A modern digital tasbih application built with Ionic, Vue 3, and Capacitor. This app allows users to count their dhikr with ease, featuring target settings and haptic feedback.

## Features

- **Digital Counter**: Tap the "Hitung (+)" button to increment your count.
- **Target Setting**: Set a target number for your dhikr session.
- **Haptic Feedback**: Vibrates when the target is reached (Mobile only).
- **Volume Button Support**: Use the volume down button to increment the count (Android/iOS only).
- **Reset Functionality**: Easily reset the counter to zero.
- **Dark Mode Support**: Automatically adapts to system theme.

## Tech Stack

- **Framework**: [Ionic Framework 8](https://ionicframework.com/)
- **UI Library**: [Vue 3](https://vuejs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Runtime**: [Capacitor 6](https://capacitorjs.com/)
- **Language**: TypeScript

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tasbih
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Building for Mobile

To build the application for Android or iOS, follow these steps:

1. **Build the web assets**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**
   ```bash
   npx cap sync
   ```

3. **Run on Android**
   ```bash
   npx cap run android
   ```

4. **Run on iOS** (macOS only)
   ```bash
   npx cap run ios
   ```

## Project Structure

- `src/views/HomePage.vue`: Main application logic and UI.
- `src/router/index.ts`: Application routing configuration.
- `src/theme/`: Global styles and variables.

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Lint the project files.
- `npm run test:e2e`: Run End-to-End tests with Cypress.
- `npm run test:unit`: Run Unit tests with Vitest.
