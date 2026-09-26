# UXMate — Design Process Coach & Project Management App

A modern, local-first UX project management and double-diamond strategy app built with React 19, TypeScript, Tailwind CSS, and Capacitor for Android.

---

## ❓ Why was nothing showing when opened from GitHub?

If you opened the project directly from GitHub or cloned it and opened `index.html` in your browser, the screen was blank because:

1. **Vite + React TypeScript requires compiling:** Browsers cannot run `.tsx` or TypeScript directly. The code must be bundled into standard JavaScript via Vite (`npm run build`).
2. **Relative Base Path:** Vite defaults to root-level `/` paths. We updated `vite.config.ts` with `base: './'` so assets load anywhere without 404 errors.
3. **GitHub Repository vs. Web Host:** A GitHub repository is a source-code host. To view it live in a browser, it needs to be served via **Vercel / Netlify**, **GitHub Pages**, or run locally with Node.js.

---

## 🚀 How to View UXMate Live

### Option 1: 1-Click Free Hosting on Vercel or Netlify (Recommended)
1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com) (both 100% free).
2. Sign in with GitHub and click **"Add New Project"**.
3. Select your `UXMate` repository.
4. Click **Deploy**. Vercel/Netlify will detect Vite automatically and give you a live HTTPS link in under 1 minute!

### Option 2: Run Locally on Your Computer
1. Clone the repository and open your terminal in the project folder:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## 📱 How to Make This a Proper Android App

The project is fully configured for native Android development using **Capacitor 8**! The native Android source code is in the `android/` folder.

### 🛠️ Method A: Build a Native Android APK with Android Studio

1. **Install Prerequisites:**
   - Install [Android Studio](https://developer.android.com/studio) (free).
   - Ensure you have Node.js installed.

2. **Sync the Web Build to the Android Project:**
   ```bash
   npm run android
   ```
   *(This builds the Vite app and copies all assets into `android/app/src/main/assets/public`)*

3. **Open the Project in Android Studio:**
   ```bash
   npm run android:open
   ```
   *Or open Android Studio manually and select the `android` folder in this repository.*

4. **Build the APK:**
   - In Android Studio, go to the top menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - Alternatively, from the terminal inside the `android/` folder, run:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
   - The compiled `.apk` will be in:
     `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Install on Your Phone:**
   - Transfer `app-debug.apk` to your Android phone via USB, Google Drive, or email, and tap to install!
   - Or plug your Android phone into your computer via USB (with USB Debugging enabled) and click the **Run ▶** button in Android Studio.

---

### 📲 Method B: Instant Android Installation (PWA / Chrome)

If you don't want to install Android Studio:

1. Open your deployed live URL in **Google Chrome** on your Android phone.
2. Tap the **Menu (⋮)** in Chrome (top-right corner).
3. Tap **"Install app"** or **"Add to Home screen"**.
4. UXMate will install onto your phone with its own custom app icon, splash screen, offline caching, and full-screen view without the browser URL bar!

---

## 📦 Project Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local dev server on port 3000 |
| `npm run build` | Builds optimized production bundle in `dist/` |
| `npm run lint` | Typechecks with TypeScript (`tsc --noEmit`) |
| `npm run android` | Builds web app & syncs into native Android project |
| `npm run android:open` | Opens the native Android project in Android Studio |
