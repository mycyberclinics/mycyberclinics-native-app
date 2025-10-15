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
```
Use `--legacy-peer-deps` to resolve temporary React 19 testing library conflicts.

---

## 🐳 Docker Development

To run the frontend with Docker:

```bash
docker compose up
```

This will launch the Expo development server inside Docker.  
- Expo Go and simulators will connect to the ports exposed in `docker-compose.yml`.
- Make sure you use the correct LAN IP if you test on a real device.

---

## 🔥 Firebase Emulator Setup (For Local Development & Backend API Testing)

> **Required for local Auth, Firestore, Storage, and Functions development!**

### **A. Prerequisite: Install Java**

The Firebase Emulator Suite requires Java (JDK 11+).  
If you see errors like `Could not spawn java -version`, follow these steps:

#### **Windows**
- Download and install from [Adoptium Temurin JDK](https://adoptium.net/temurin/releases/) or [Oracle JDK](https://www.oracle.com/java/technologies/downloads/).
- After installation, add the Java `bin` directory (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.x.x\bin`) to your system `PATH`.
- Restart your terminal and check:
  ```sh
  java -version
  ```
  You should see your Java version.

#### **macOS**
- Install via Homebrew:
  ```sh
  brew install temurin
  ```
- Or download from the Adoptium or Oracle links above.
- Confirm installation:
  ```sh
  java -version
  ```

#### **Ubuntu/Linux**
```sh
sudo apt-get update
sudo apt-get install openjdk-17-jdk
java -version
```

---

### **B. Install Firebase CLI**

```bash
npm install -g firebase-tools
```

---

### **C. Start the Firebase Emulators**

From your project root (where `firebase.json` lives):

```bash
firebase emulators:start
```

This will start:
- **Auth Emulator:** http://localhost:9099
- **Firestore Emulator:** http://localhost:8080
- **Storage Emulator:** http://localhost:9199
- **Functions Emulator:** http://localhost:5001
- **Emulator UI:** http://localhost:4000

> **Note:** If you run into permission errors, try with `sudo` or check your Java installation.

---

### **D. Emulator Connection in the Frontend**

The app automatically connects to emulators in development mode (`__DEV__`), using the settings in `firebase.ts`.  
No manual change needed—you can sign up, sign in, and interact with local Firestore/Storage/Functions.

---

### **E. Troubleshooting**
- If you see `Could not spawn java -version`, repeat the Java install steps and ensure your terminal recognizes `java`.
- On Windows, restart your computer after changing `PATH`.
- If emulators fail to start, check for conflicting ports or missing rules files (`firestore.rules`, `storage.rules`).

---

## 🎨 Styling with NativeWind

See [NativeWind documentation](https://www.nativewind.dev/) for usage.

---

## 📦 Build & Deploy

Local Development:
```bash
npm run android     # Android emulator
npm run ios         # iOS simulator
npm run web         # Expo web
```

Cloud Builds (EAS):
```bash
eas build --platform android
eas build --platform ios
```

OTA Updates:
```bash
eas update --branch production --message "Release notes here"
```

---

## 💡 Contributing

Create a new branch
```bash
git checkout -b feature/your-feature
```
Make your changes

Run linters before committing
```bash
npm run lint
```

Submit a PR with a clear description of your change

---

## 🧑‍💻 Getting Started: Full Local Setup Summary

1. **Install Node.js & npm**
2. **Install Java (JDK 11+)** (see steps above)
3. **Install Firebase CLI**
4. **Clone repo & install dependencies**
5. **Start Firebase emulators:** `firebase emulators:start`
6. **Start Docker/Expo:** `docker compose up` or `npx expo start`
7. **Access Emulator UI:** http://localhost:4000

You are now ready to develop with full local Firebase backend and frontend!
