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
- Role-based authentication and permissions using **Firebase Emulator** for local development  
- Custom claims for user roles (admin, doctor, patient, nurse, support)
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
npm install
```
Use `--legacy-peer-deps` to resolve temporary React 19 testing library conflicts.

---

## 🐳 Docker Development

## ✅ How to Pull & Run Your Expo React Native App from Docker Hub

Follow the steps below to pull and run your Expo React Native app inside a Docker container from your Docker Hub repository.

---

### 🔹 1. **Login to Docker Hub (if needed)**

If your image is private, log in to Docker Hub:

```bash
docker login
```

You'll be prompted to enter your Docker Hub username and password (or a personal access token).

---

### 🔹 2. **Pull the Docker Image**

Download the image from your Docker Hub account:

```bash
docker pull timex19/mycyberclinics:client-expo
```

This retrieves the Docker image containing your **Expo React Native** project.

---

### 🔹 3. **Run the Docker Container**

Use the following command to start the container:

```bash
docker run -it   -e REACT_NATIVE_PACKAGER_HOSTNAME=10.184.137.118   -p 8081:8081   -p 19000:19000   -p 19001:19001   --name mycyberclinics-container   timex19/mycyberclinics:client-expo
```

#### 🔸 Explanation:

* `-it`: Runs the container in interactive mode (useful for development/log output).
* `-e REACT_NATIVE_PACKAGER_HOSTNAME=<your-ip-address>`: Sets the host IP for the React Native packager to enable communication with physical devices or emulators.
* `-p`: Maps container ports to your host machine (required by Expo).

  * `8081`: Metro bundler port
  * `19000`: Expo DevTools
  * `19001`: WebSocket port used by the Expo app
* `--name`: (Optional) Names your container for easier reference.

---

### 💻 Accessing Your App

Once running, you can access the Expo development interface via:

```text
http://localhost:19000
```

Use the Expo Go app (on a physical device) or an emulator to scan the QR code from the DevTools or connect using the Metro bundler interface.

---

### 🧼 Optional: Clean Up

#### To stop and remove the container:

```bash
docker stop mycyberclinics-container
docker rm mycyberclinics-container
```

#### To remove the image:

```bash
docker rmi timex19/mycyberclinics:client-expo
```

---



To run the frontend with Docker:

```bash
docker compose up
```

This will launch the Expo development server inside Docker.  
- Expo Go and simulators will connect to the ports exposed in `docker-compose.yml`.
- Make sure you use the correct LAN IP if you test on a real device.

---

## 🔥 Firebase Emulator Authentication — **Getting Started Guide for New Developers**

This project uses the **Firebase Emulator Suite** for all authentication, user management, and role-based access control during local development.  
This enables you to test login, sign-up, custom claims (roles), and security rules **without touching live Firebase data**.

### **A. Prerequisite: Install Java**

The Firebase Emulator Suite requires Java (JDK 11+).  
If you see errors like `Could not spawn java -version`, follow these steps:

#### **Windows**
- Download and install from [Adoptium Temurin JDK](https://adoptium.net/temurin/releases/) or [Oracle JDK](https://www.oracle.com/java/technologies/downloads/).
- After installation, add the Java `bin` directory (e.g., `C:\Program Files\Eclipse Adoptium\jdk-17.x.x\bin`) to your system `PATH`.
- Open a new terminal and check:
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
firebase emulators:start --import=./firebase-data --export-on-exit
```

This will start:
- **Auth Emulator:** http://localhost:9099
- **Firestore Emulator:** http://localhost:8080
- **Storage Emulator:** http://localhost:9199
- **Functions Emulator:** http://localhost:5001
- **Emulator UI:** http://localhost:4000

> **Note:**  
> - If you run into permission errors, try with `sudo` or check your Java installation.
> - Data is persisted to `./firebase-data` so you can reuse your test users and claims.

---

### **D. How the App Connects to the Emulator**

- The frontend is already configured to connect to the local emulator when in development mode (`__DEV__`).
- **No manual config required!**
- You can sign up, log in, and test authentication flows as you would in production.
- All API calls and Firebase SDK calls will use emulator data.

---

### **E. Creating and Managing Test Users (Admin, Doctor, Patient, etc.)**

1. **Create test users** using the sign-up flow in the app, or directly in the Emulator UI (`http://localhost:4000`).
2. **Assign roles (custom claims):**
   - Use the built-in **Admin Role Manager** screen (usually at `/admin/roles` in the app) to set roles for users.
   - Only users with the `admin` claim can access this screen.
   - Set roles such as `{ roles: { admin: true, doctor: true, patient: false } }`.
   - After roles are assigned, users should sign out and back in to refresh their claims.

---

### **F. Testing Role-Based Authentication**

- **Sign in as different users** (admin, doctor, patient, etc.) and confirm your UI and data access are correctly restricted.
- The app uses a `ClaimsProvider` context to make claims available everywhere.
- **Admin users** can access the roles screen and change roles for other users.
- **Non-admins** will see a "403 — Admins only" message if they try to access `/admin/roles`.

---

### **G. Example Test Users (for dev onboarding)**

| Role   | Email              | Password | How to create         |
|--------|--------------------|----------|-----------------------|
| Admin  | josephdoe@hotmail.com     | Password123 | Sign up, set admin role in roles screen |
| Doctor | markwilliams@hotmail.com    | Password123 | Sign up, set doctor role |
| Nurse | vickkyjames@hotmail.com   | Password123 | Sign up, set nurse role |
| Support | happiness@mycyberclinics.com   | Password123 | Sign up, set support role |
| Patient | solatola@hotmail.com   | Password123 | Sign up, set patient role |

You can view and manage users in the **Emulator UI** at [http://localhost:4000](http://localhost:4000).

---

### **H. Troubleshooting**

- **If `Could not spawn java -version`:**  
  - Install Java and add it to your system `PATH`.
  - Restart your terminal/computer.
- **If emulators fail to start:**  
  - Check for conflicting ports or missing rules files (`firestore.rules`, `storage.rules`).
- **If authentication doesn’t work:**  
  - Ensure you’re running the emulators and your app is in development mode.
  - Check the emulator logs for errors.

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

## 🧑‍💻 Full Local Setup Summary (for Firebase Emulator Auth!)

1. **Install Node.js & npm**
2. **Install Java (JDK 11+)** (see steps above)
3. **Install Firebase CLI**
4. **Clone repo & install dependencies**
5. **Start Firebase emulators:**  
   `firebase emulators:start --import=./firebase-data --export-on-exit`
6. **Start Docker/Expo:**  
   `docker compose up` or `npx expo start`
7. **Access Emulator UI:**  
   http://localhost:4000
8. **Sign up test users, set roles, and test authentication flows!**

You are now ready to develop and test with full local Firebase backend and frontend, including authentication and role-based access!

---