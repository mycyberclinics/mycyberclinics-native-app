# 📱 MyCyberClinics Mobile App (Frontend)

A **modern React Native / Expo** frontend scaffold for the **MyCyberClinics** ecosystem.  
It’s designed for performance, scalability, and excellent developer experience — balancing **fast iteration** with **enterprise-grade stability**.

---

## 🚀 Tech Stack

### 🧩 Platform & Core
- **[Expo SDK 54](https://docs.expo.dev)** — Development builds + OTA updates  
- **[React Native 0.81 (Fabric)](https://reactnative.dev)** — Cross-platform runtime  
- **TypeScript (strict)** — Type-safe, maintainable code  
- **[Expo Router v6](https://expo.github.io/router/docs)** — File-based navigation  
- **Path aliases (`@/`)** — Cleaner imports  

---

### 🎨 UI & Styling
- **[NativeWind v4 (Tailwind)](https://www.nativewind.dev)** — Utility-first styling  
- **`SafeAreaProvider` + `useSafeAreaInsets`** — Global layout padding  
- **Dark / Light Mode** — Auto-detected via `useColorScheme()`  

---

### 🧠 State & Data
- **[Zustand](https://zustand-demo.pmnd.rs/)** — Lightweight local state management (slice pattern)  
- **[TanStack Query](https://tanstack.com/query/latest)** — API / Firestore reads, caching, and offline sync  
- **[Zod](https://zod.dev)** — Runtime schema validation  

---

### 📝 Forms & Validation
- **[react-hook-form](https://react-hook-form.com)** + `@hookform/resolvers` — Declarative form control and runtime validation  

---

### 🔐 Authentication
- **[Firebase Auth](https://firebase.google.com/docs/auth)** — Google / Apple / Email SSO  
- Backend verification via **Firebase Admin SDK** on Koa + Mongo  

---

### 🌍 Internationalization
- **[react-i18next](https://react.i18next.com)** — Production-ready i18n support  

---

### 🧪 Testing
- **jest** + **@testing-library/react-native** + **jest-expo** — Unit & component tests  
- **Maestro (optional)** — End-to-end mobile testing  

---

### 🧰 Code Quality & Tooling
- **eslint-config-universe** + **Prettier** — Consistent linting and formatting  
- **Husky** + **lint-staged** — Pre-commit checks  
- **TypeScript strict mode** — Prevents silent runtime issues  

---

## 🧭 Project Structure
app/
├─ _layout.tsx # Root layout + safe area + theme + splash
├─ index.tsx # Redirect → onboarding or main app
├─ (onboarding)/ # Onboarding flow screens
│ ├─ index.tsx # Screen 1
│ ├─ screen2.tsx
│ └─ screen3.tsx
├─ (auth)/ # Auth routes
└─ (main)/ # Main app (stack)

assets/
└─ images/ # Static images + icons

components/ # Reusable UI elements
hooks/ # Custom hooks
providers/ # Global context providers
store/ # Zustand state slices
utils/ # Helpers + Zod schemas
global.css # Tailwind base styles 


---

## 🛠 Installation & Setup

### 1️⃣ Clone & Install Dependencies
```bash
git clone https://github.com/mycyberclinics/mycyberclinics-native-app.git
cd mycyberclinics-native-app/client
npm install --legacy-peer-deps
Use --legacy-peer-deps to resolve temporary React 19 testing library conflicts.


2️⃣ Start Development Server
npx expo start

Press a → Android emulator

Press i → iOS simulator

Or scan the QR code with Expo Go


3️⃣ Optional — Build Dev Clients
eas build --profile development --platform android
eas build --profile development --platform ios


4️⃣ Environment Variables

Create a .env file in the project root:
- FIREBASE_API_KEY=xxxx
- FIREBASE_AUTH_DOMAIN=xxxx
- FIREBASE_PROJECT_ID=xxxx


Access via expo-constants
 or react-native-dotenv.


🎨 Styling with NativeWind

babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel"],
  };
};


tailwind.config.js

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};


Example:

<View className="flex-1 items-center justify-center bg-emerald-500">
  <Text className="text-white text-lg font-bold">NativeWind Works ✅</Text>
</View>


🌗 Theme Support

Automatically detects dark/light mode via useColorScheme()

Future plan: user override toggle in app settings (using Zustand)


🔒 Authentication Flow (Planned)

Firebase Auth handles Google/Apple/Email login

Server verification through Firebase Admin SDK

Optional Firestore integration for real-time sync


🧠 Onboarding Flow

Displays only on first launch (tracked via AsyncStorage)

Adapts to dark/light mode

Multilingual support via react-i18next

Built using Expo Router v6 file-based routing 


🧩 State & Data Providers (Planned)
<QueryClientProvider client={queryClient}>
  <ZustandProvider>
    <FirebaseProvider>
      <Stack />
    </FirebaseProvider>
  </ZustandProvider>
</QueryClientProvider>


TanStack Query → API + Firestore caching / offline sync

Zustand → Lightweight global state

Zod → Runtime validation for all API schemas


🧪 Testing
Unit & Component

jest-expo

@testing-library/react-native

Run tests:

npm test


End-to-End with Maestro (Optional)

Maestro
 for mobile UI automation:

maestro test


🔧 Code Quality
ESLint / Prettier
// .eslintrc.js
extends: ["universe/native", "prettier"]

Husky + lint-staged
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
},
"lint-staged": {
  "*.{js,jsx,ts,tsx}": "eslint --fix"
}


Run lint manually:

npm run lint


📦 Build & Deploy

Local Development

npm run android     # Android emulator
npm run ios         # iOS simulator
npm run web         # Expo web


Cloud Builds (EAS)

eas build --platform android
eas build --platform ios


OTA Updates

eas update --branch production --message "Release notes here"


📁 Key Files Overview

app/_layout.tsx — Global layout: SafeArea, theme, splash

app/index.tsx — Redirect entry point

app/(onboarding)/ - on-boarding screens

babel.config.js — Babel setup for Expo + NativeWind

tailwind.config.js — Tailwind + NativeWind configuration

global.css — Base CSS for NativeWind

tsconfig.json — TypeScript config + path aliases



💡 Contributing

Create a new branch

git checkout -b feature/your-feature


Make your changes

Run linters before committing

npm run lint


Submit a PR with a clear description of your change