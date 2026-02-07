# 🏥 Nurse Learning Corner: Web Implementation Master Plan

This document serves as the technical blueprint for migrating the **Nurse Learning Corner** mobile app functionalities to a modern **Next.js + Tailwind CSS** web application (PWA), optimized for iOS "Add to Home Screen" usage.

---

## 🛠 Target Tech Stack
- **Framework:** Next.js 15+ (App Router, TypeScript)
- **Styling:** Tailwind CSS (Vanilla)
- **Animations:** Framer Motion (for premium UI/UX)
- **Backend:** Appwrite (reuse existing project, database, and storage)
- **State Management:** React Context API or Zustand
- **PDF Viewing:** `react-pdf` or browser native `iframe`

---

## 🔑 1. Backend Integration (Appwrite)
Replicate the service layer found in `src/services/`.
- **Database ID:** Use the existing production Database.
- **Collections:**
  - `profiles`: User metadata, subscription status, and preferences.
  - `content`: Study materials, subjects, programs, and storage file IDs.
  - `notes`: User-specific study reflections linked to content IDs.
  - `flashcards`: Questions, answers, and categories.
  - `recent_activity`: Unified log of recently accessed items.

---

## 📱 2. Core Functional Modules

### A. Authentication & Onboarding
- **Features:** Email/Password Login, Signup, OTP Verification flow, and Password Reset.
- **Next.js Specifics:** Implement a `middleware.ts` to protect routes. Use Appwrite's Web SDK.
- **UX:** Premium glassmorphism login cards with subtle animations.

### B. Intelligent Library
- **UI:** A grid-based layout of "Content Cards" with metadata badges (Subject, Program).
- **Filtering System:**
  - Implement a multi-select filter (Program, Subject, Year).
  - Real-time search bar with debounce.
- **Content Viewer:**
  - **PDFs:** High-performance viewer with "Resume from Last Page" logic (fetch `lastPosition` from Appwrite).
  - **Links:** Open in new tabs or secure embedded frames.

### C. Flashcard Study Engine
- **Study Mode:** A focus-centric UI. Implement a "3D Flip Card" using Tailwind's `transform-style: preserve-3d` and Framer Motion.
- **Logic:** Track "Mastered" vs "Learning" status. Provide a summary screen at the end of each session.

### D. Digital Notebook
- **Interface:** A split-screen or overlay view allowing users to take notes *while* reading a PDF.
- **Sync:** Auto-save notes to the `notes` collection using `onBlur` or a debounced `onChange`.

---

## 🎨 3. Design System (Professional/Premium)
Maintain the "Expert Medical" aesthetic:
- **Colors:**
  - Light Mode: White/Slate-50 backgrounds with Blue-600 accents.
  - Dark Mode: Slate-950 backgrounds with deep Indigo/Blue accents.
- **Typography:** Use **Plus Jakarta Sans** or **Inter** (Google Fonts).
- **Navigation:**
  - Mobile: Fixed bottom navigation bar (Home, Library, Flashcards, Notebook, Profile).
  - Desktop: Sidebar navigation.

---

## 📶 4. PWA & iOS Optimization
Essential for the "Mobile-Web" experience:
1. **Manifest.json:**
   - `display: standalone` (removes browser URL bar).
   - `orientation: portrait`.
2. **Apple Touch Icons:** Provide high-quality 180x180 icons.
3. **Meta Tags:**
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   ```

---

## 💾 5. Offline Functionality & In-App Downloads (Web)
To replicate the mobile offline experience, the web app must use browser storage APIs:

### A. Asset Caching (Service Workers)
- **Tool:** Use `next-pwa` (Workbox) to generate a Service Worker.
- **Strategy:** Cache core UI assets (JS/CSS/Fonts) and the "Library Shell" so the app loads instantly even without internet.
- **Offline Page:** Implement a dedicated `/offline` fallback page.

### B. In-App File Storage (IndexedDB)
Since `expo-file-system` doesn't exist on web, use **IndexedDB** to store PDF blobs:
- **Library:** Use `idb` or `Dexie.js` for easier database management.
- **Download Logic:** 
  1. Fetch the PDF as a `Blob` from Appwrite Storage.
  2. Store the `Blob` and metadata (title, subject) in IndexedDB.
  3. UI Update: Set a "Downloaded" status in the Library grid.
- **Viewing Offline:** When the user clicks "Study", first check IndexedDB. If found, generate a `URL.createObjectURL(blob)` to feed the PDF viewer.

### C. Background Sync
- Sync study progress (notes, flashcard mastery, last read page) to a local "Sync Queue" when offline.
- Use the **Background Sync API** to push these updates to Appwrite once the connection is restored.

---

## 📂 5. Recommended Project Directory
```text
/src
  /app            # Next.js App Router (pages/routes)
  /components     # Atomic UI components, Layouts
  /context        # AuthContext, ThemeContext
  /hooks          # useAppwrite, useLocalStorage
  /lib            # Appwrite client init, utils
  /services       # Logic for auth, content, flashcards, notes
  /types          # TypeScript interfaces (match mobile types)
```

---

## 🚀 Step-by-Step Instructions for the AI
1. **Initialize:** Start a new Next.js project with Tailwind and TypeScript.
2. **Setup Appwrite:** Create the client in `@/lib/appwrite.ts` using your Project ID and Endpoint.
3. **Build Layout:** Implement the `root layout.tsx` with Theme support and the Navigation bar.
4. **Auth First:** Build the Login/Signup flow and the Auth Context provider.
5. **Dashboard:** Build the Home screen with "Recent Activity" and "Continue Learning" sections.
6. **Library:** Implement the content fetching logic and filtering UI.
7. **Study Tools:** Build the Flashcard flip-logic and the Notes editor.
8. **Final Polish:** Add PWA manifest and iOS meta tags.
