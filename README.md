# AlertNet

## Project Overview

AlertNet is a disaster response and safety portal built with Next.js, Firebase, and Genkit AI. The application is designed for both citizens and emergency officials to:

- Receive real-time alerts
- Generate safe evacuation routes
- Report incidents with images and location data
- Manage help centers, officials, and rescue teams
- Display routes and safety data on interactive maps


## Key Features

1. **Authentication and Role Routing**
   - Email/password login using Firebase Authentication
   - Role determination using Firestore collections: `admins`, `officials`, `users`
   - Automatic redirect to the appropriate dashboard for citizens or officials

2. **Safe Path Guidance**
   - User location resolved through geolocation or Firestore user profile
   - AI-generated safe route suggestions via Genkit
   - Leaflet map rendering with OSRM routing and fallback polyline display

3. **Real-time Alerts**
   - Officials can create alerts stored in Firestore `alerts`
   - Citizens and officials can read alerts in real time using Firestore snapshot listeners

4. **Photo Reporting**
   - Citizens can upload incident photos and descriptions
   - Reports are saved in Firestore `reports`
   - Location may be fetched via browser geolocation or entered manually

5. **Admin / Official Management**
   - Register helpline centers (`help-centers`)
   - Register officials (`officials`)
   - Manage rescue teams and resources
   - Manage ambulances and safety tools

6. **Localization / UI Translation**
   - Landing page text translation using the `translateUI` AI flow
   - Language selection persists in local storage


## Technology Stack

- Next.js 15 (App Router)
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Firebase Analytics
- Genkit AI flows (`@genkit-ai/googleai`, `genkit`)
- Leaflet and Leaflet Routing Machine
- React Hook Form + Zod
- Tailwind CSS + Radix UI components


## High-Level Architecture (HLD)

### 1. Frontend

- **Next.js App Router** handles page routing and dynamic imports
- Client-side pages are marked with `"use client"`
- UI uses Radix and custom components for reusable layout and form elements
- Critical pages:
  - `src/app/page.tsx` — landing and language routing
  - `src/app/login/page.tsx` — login flow and session role detection
  - `src/app/signup/page.tsx` — user registration
  - `src/app/dashboard/page.tsx` — citizen dashboard and feature grid
  - `src/app/admin/dashboard/page.tsx` — official/admin dashboard

### 2. Backend / Persistence

- **Firebase Auth** stores user credentials and performs authentication
- **Firestore** stores domain data, including:
  - `users`
  - `officials`
  - `admins`
  - `help-centers`
  - `alerts`
  - `reports`
  - `rescue_teams`
  - `ambulances`
  - `safety_tools`

- Firebase config is initialized in `src/lib/firebase.ts`
- Environment variables are required for Firebase and AI keys

### 3. AI and Route Generation

- Genkit AI flows are defined under `src/ai/flows`
- `dynamic-safe-path-guidance.ts` provides safe path generation
- The workflow:
  1. Collect user location + disaster metadata
  2. Fetch help center list from Firestore
  3. If AI key exists, call the Genkit prompt
  4. If AI fails or key is missing, use fallback route generation


## Low-Level Design (LLD)

### Important Files and Responsibilities

- `src/lib/firebase.ts`
  - Initialize Firebase app
  - Expose `auth`, `db`, and `analytics`
  - Validate required `NEXT_PUBLIC_FIREBASE_*` env vars

- `src/app/login/page.tsx`
  - Sign in with `signInWithEmailAndPassword`
  - Set browser session persistence
  - Query Firestore for role-based documents
  - Store `userEmail`, `userUid`, and `userRole` in sessionStorage
  - Redirect users to `/dashboard` or `/admin/dashboard`

- `src/components/dashboard/SafePath.tsx`
  - Collect current location, disaster type, and severity
  - Attempt browser geolocation
  - Load stored address from Firestore user profile if available
  - Call `getSafePath()` and show route data
  - Render `DynamicMap` when valid coordinates are available

- `src/components/dashboard/DynamicMap.tsx`
  - Initialize Leaflet map client-side only
  - Add start/end markers and route geometry
  - Use `leaflet-routing-machine` with OSRM
  - Fallback to dashed polyline if routing fails

- `src/ai/flows/dynamic-safe-path-guidance.ts`
  - Define AI prompt schema and output schema
  - Fetch `help-centers` from Firestore or fallback mock data
  - Use Google AI key from `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `GOOGLE_GENAI_API_KEY`
  - Provide textual safe path and destination coordinates

- `src/components/admin/AlertBroadcaster.tsx`
  - Send and display alerts from the `alerts` collection
  - Delete alerts via Firestore

- `src/components/dashboard/PhotoReporter.tsx`
  - Upload image preview and incident description
  - Save report documents to Firestore `reports`

- `src/components/dashboard/DashboardFeatureGrid.tsx`
  - Render feature cards for the citizen dashboard
  - Show online-only badges and disable features when offline

- `src/app/admin/register-helpline/page.tsx`
  - Create `help-centers` documents with optional geocoordinates

- `src/app/admin/register-official/page.tsx`
  - Create `officials` documents for role-based access

- `src/app/admin/rescue-allocation/page.tsx`
  - Manage `rescue_teams`, `ambulances`, and `safety_tools`


## Data Model Summary

### `users`
- `name`
- `email`
- `address`
- `phone`
- `role` or implicit citizen
- `createdAt`

### `officials`
- `name`
- `email`
- `phone`
- `designation`
- `department`
- `region`
- `role` = `official`
- `createdAt`

### `admins`
- Similar to `officials`
- Used for admin-level access checks

### `help-centers`
- `name`
- `location` (address string)
- `coordinates` (Firestore `GeoPoint` if provided)
- `contact` object
- `registeredAt`

### `alerts`
- `title`
- `message`
- `severity`
- `timestamp`

### `reports`
- `description`
- `imageUrl`
- `location`
- `reporterEmail`
- `timestamp`

### `rescue_teams`
- `teamName`
- `members`
- `createdAt`
- `createdBy`

### `ambulances`
- `driver`
- `phone`
- `eta`
- `status`
- `createdBy`

### `safety_tools`
- `name`
- `quantity`
- `location`
- `reserved`


## Data Flow Diagram (Textual)

1. **Landing page**
   - User opens `/`
   - `onAuthStateChanged` checks Firebase auth state
   - If logged in, determine Firestore role and redirect to `/dashboard` or `/admin/dashboard`

2. **Login**
   - User submits form on `/login`
   - `signInWithEmailAndPassword` authenticates user
   - Role resolution uses Firestore collections
   - Session storage saves `userUid`, `userEmail`, `userRole`
   - Redirects based on role

3. **Safe Path**
   - User opens `/dashboard/safe-path`
   - Page resolves location via geolocation or user profile
   - Calls `getSafePath` AI flow
   - Fetches help center list from Firestore
   - AI flow returns safe path plus coordinates
   - Map renders route using Leaflet and OSRM

4. **Alerts and reporting**
   - Officials create Firestore `alerts`
   - Citizens read `alerts` with snapshot listeners
   - Citizens submit `reports`
   - Officials can read reports in admin panels

5. **Admin resource management**
   - Officials add help centers, rescue teams, ambulances, and tools
   - Data is stored in Firestore collections and shown to admin pages


## Authentication Flow

1. **Firebase Authentication**
   - Login uses email/password with `signInWithEmailAndPassword`
   - Session persistence is enabled via `browserSessionPersistence`

2. **Role determination**
   - If the email matches `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`, the user is treated as an official/admin
   - Otherwise, Firestore is queried for documents in:
     - `officials`
     - `admins`
     - `users`
   - The first matching Firestore document determines the role

3. **Session state**
   - After successful login, the app stores:
     - `userEmail`
     - `userUid`
     - `userRole`
   - This state is used by pages to resolve user-specific behavior and Firestore queries

4. **Authorization assumptions**
   - Admin and official access is validated by Firestore document membership
   - The landing page uses `onAuthStateChanged` to route authenticated users immediately
   - Protected routes rely on client-side role checks and Firestore structure


## Deployment and Production Notes

- Use `.env.local` for local development
- Set production `NEXT_PUBLIC_FIREBASE_*` env vars in your hosting provider
- Use `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `GOOGLE_GENAI_API_KEY` for AI access
- Build with:
  ```bash
  npm install
  npm run build
  npm run start
  ```
- For production, do not expose test or development API keys
- Add Firestore security rules in `firestore.rules` and configure `firebase.json`


## How to Run Locally

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:9002`


## Notes

- `SafePath` currently requires parseable coordinates or browser geolocation for map rendering
- Fallback AI route generation works if no AI API key is configured
- The app is built to be extended with additional voice SOS, community help, and disaster monitoring features
