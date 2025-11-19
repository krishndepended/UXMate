# UXMate — Local PWA

UXMate is a local-first project management tool for UX designers. 

## 🚀 How to Run Locally

This app works directly in the browser. Because it uses ES Modules and Babel for local JSX, it **must be served over HTTP/HTTPS**, not opened directly as a `file://`.

### 1. Prerequisites
You need a simple static file server. Python is usually installed on most systems.

### 2. Start Server
Open your terminal in this folder and run:

```bash
# Python 3
python -m http.server 8000
```

### 3. Open App
Go to `http://localhost:8000` in your browser (Chrome recommended).

---

## 📱 How to Install (PWA)

You can install this app to your device so it works offline and looks like a native app.

### Android (Chrome)
1. Open the app in Chrome.
2. Tap the **Menu (⋮)** button.
3. Tap **"Add to Home screen"** or **"Install app"**.

### iOS (Safari)
1. Open the app in Safari.
2. Tap the **Share** button.
3. Scroll down and tap **"Add to Home Screen"**.

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar (right side).
2. Click **Install**.

---

## 💾 Storage & Backup
*   **Local Mode:** All data is saved in your browser's `Local Storage`. 
*   **Warning:** Clearing browser cache will delete your projects!
*   **Backup:** Use the "Export HTML" feature inside a project to save a backup of your work.

## ☁️ Enable Cloud Sync (Optional)
To sync across devices, open `index.html` and replace the `FIREBASE_CONFIG_PLACEHOLDER` with your own Firebase project configuration.
