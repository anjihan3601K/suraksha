# AlertNet SafePath & Map Routing Documentation

## Overview
This document describes the Safe Path routing implementation for the AlertNet application, including how the UI displays the safest route on a map and how the system falls back when AI/API credentials are unavailable.

## Architecture
- Next.js App Router + TypeScript for the frontend.
- Firebase Auth + Firestore for user and help center data.
- Genkit AI flows for dynamic safe path generation.
- Leaflet + Leaflet Routing Machine for map visualization.

## Core Files
- `src/components/dashboard/SafePath.tsx`
  - Handles user input for current location, disaster type, and severity.
  - Resolves user location from geolocation or the authenticated user's Firestore profile.
  - Calls `getSafePath()` to compute the safest route.
  - Renders the route result and displays `DynamicMap` when valid coordinates exist.

- `src/components/dashboard/DynamicMap.tsx`
  - Initializes a Leaflet map and renders route geometry between start/end coordinates.
  - Uses OSRM routing with `leaflet-routing-machine`.
  - Falls back to a simple polyline if route calculation fails.

- `src/ai/flows/dynamic-safe-path-guidance.ts`
  - Defines the AI prompt and safe path flow.
  - Loads help centers from Firestore and falls back to local mock help center data.
  - Uses API credentials when present.
  - Returns a fallback route when AI credentials are missing or service fails.

## Safe Path Flow
### 1. Location Resolution
`SafePath.tsx` tries to determine the user's starting location in this order:
- `navigator.geolocation` if supported and permission granted.
- The signed-in user's Firestore profile address via UID or email lookup.
- If neither is available, the user can enter their current location manually.

### 2. AI Route Generation
`dynamic-safe-path-guidance.ts` performs the following:
- Fetches help center records from the Firestore `help-centers` collection.
- If no help centers exist in Firestore, it falls back to the seeded mock help centers in `src/lib/mock-data.ts`.
- If a supported Google AI API key is configured, the flow sends the request to Genkit.
- The AI prompt selects the nearest help center, creates a safe route description, estimates travel time, and assigns a risk level.

### 3. API Fallback Behavior
If no AI key is available, or the AI request fails, the app now uses a fallback route generator:
- Parses numeric coordinates from `currentLocation`.
- Chooses the nearest help center by distance.
- Returns a textual safe path and destination coordinates.
- This ensures the UI still receives route coordinates for map rendering even without API credits.

## Map Display
`DynamicMap.tsx` ensures the safest route appears on a map:
- Start and end markers are added for the current location and help center.
- OSRM routing is requested from `https://router.project-osrm.org/route/v1`.
- When a route is successfully found, the map zooms to fit the route bounds.
- If routing fails, a fallback dashed polyline is drawn between the start and destination points.

## Key Fixes Completed
- Added `geoStartCoords` to preserve accurate start coordinates from geolocation.
- Ensured `SafePath` uses start coordinates for map rendering rather than only textual location.
- Added robust user profile location resolution via both UID and email lookups.
- Implemented AI fallback route generation when no API credentials are present.
- Updated map layer cleanup and routing control refresh logic to avoid stale map state.

## How to Verify
1. Start the app with `npm run dev`.
2. Open the Safe Path page in the dashboard.
3. Click the location fetch button or enter coordinates manually.
4. Submit a safe path request.
5. Confirm the map displays a route from the current location to the recommended help center.
6. Test fallback behavior by removing or disabling the configured AI API key. The system should still return a route and draw a fallback path on the map.

## Production Recommendations
- Add a dedicated geocoding service to support free-text addresses and automatically convert them to coordinates.
- Use a managed routing/API provider for production traffic instead of the public OSRM endpoint.
- Store geocoded help center coordinates in Firestore to avoid repeated parsing and increase reliability.
- Consider adding turn-by-turn UI instructions for route guidance in addition to the map.

## Notes
- The UI currently requires parseable coordinate input for map rendering when geolocation is unavailable.
- Address-only input will still generate a safe path text result, but map rendering may not work unless the address is convertible to coordinates.
- `DynamicMap` is deliberately client-only to avoid server-side rendering issues with Leaflet and browser APIs.
