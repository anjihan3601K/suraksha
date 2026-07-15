
'use server';
/**
 * @fileOverview A dynamic safe path guidance AI agent.
 *
 * - getSafePath - A function that provides the safest evacuation route dynamically to a help center.
 * - GetSafePathInput - The input type for the getSafePath function.
 * - GetSafePathOutput - The return type for the getSafePath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, getDocs, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { helpCenters as mockHelpCenters } from '@/lib/mock-data';

const GetSafePathInputSchema = z.object({
  currentLocation: z
    .string()
    .describe('The current GPS coordinates of the user.'),
  disasterType: z.string().describe('The type of disaster occurring.'),
  disasterSeverity: z.string().describe('The severity of the disaster.'),
});
export type GetSafePathInput = z.infer<typeof GetSafePathInputSchema>;

const GetSafePathOutputSchema = z.object({
  destination: z.string().describe('The name of the destination help center.'),
  destinationCoords: z.object({
    lat: z.number(),
    lng: z.number(),
  }).describe('The latitude and longitude of the destination help center.'),
  safePath: z.string().describe('The safest evacuation route, including street names and directions.'),
  estimatedTime: z
    .string()
    .describe('The estimated travel time to reach the safe location.'),
  riskLevel: z.string().describe('The assessed risk level of the proposed route (e.g., Low, Moderate, High).'),
});
export type GetSafePathOutput = z.infer<typeof GetSafePathOutputSchema>;

export async function getSafePath(input: GetSafePathInput): Promise<GetSafePathOutput> {
  return getSafePathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getSafePathPrompt',
  input: {schema: z.object({
    currentLocation: GetSafePathInputSchema.shape.currentLocation,
    disasterType: GetSafePathInputSchema.shape.disasterType,
    disasterSeverity: GetSafePathInputSchema.shape.disasterSeverity,
    helpCenters: z.array(z.object({
        name: z.string(),
        location: z.string(),
    })),
  })},
  output: {schema: GetSafePathOutputSchema},
  prompt: `You are an expert in emergency response and dynamic route planning. Your task is to provide the safest and most efficient evacuation route from a user's location to the nearest available help center.

**Available Help Centers (Name, Latitude, Longitude):**
{{#each helpCenters}}
- **{{name}}**: {{location}}
{{/each}}

**User's Situation:**
- **Current Location:** {{{currentLocation}}}
- **Disaster Type:** {{{disasterType}}}
- **Disaster Severity:** {{{disasterSeverity}}}

**Your Task:**
1.  **Identify Nearest Center:** From the list of help centers, find the one closest to the user's location.
2.  **Set Destination:** The 'destination' field in the output must be the name of the help center you've chosen.
3.  **Set Destination Coordinates:** The 'destinationCoords' field must be the latitude and longitude of the chosen help center. Parse the location string from the help center list to get these values.
4.  **Generate a Safe Path:** Create a clear, turn-by-turn evacuation route to that nearest help center. The route must avoid obstacles related to the disaster type (e.g., for a flood, avoid low-lying areas; for a wildfire, route away from the fire's direction).
5.  **Estimate Time:** Calculate the estimated time to travel this route.
6.  **Assess Risk:** Determine the risk level of the generated path.

Provide the output in the specified JSON format.`,
});

const getSafePathFlow = ai.defineFlow(
  {
    name: 'getSafePathFlow',
    inputSchema: GetSafePathInputSchema,
    outputSchema: GetSafePathOutputSchema,
  },
  async input => {
    // Fetch help centers from Firestore
    const helpCentersCol = collection(db, 'help-centers');
    const helpCenterSnapshot = await getDocs(helpCentersCol);
    const helpCenters = helpCenterSnapshot.docs.map(doc => {
        const data = doc.data();
        let location = '';
        if (data.coordinates instanceof GeoPoint) {
            location = `${data.coordinates.latitude}, ${data.coordinates.longitude}`;
        } else if (data.location) {
            // If location is a string but not a GeoPoint, use it directly
            // This might be less reliable for the AI but provides a fallback
            location = data.location;
        }

        return {
            name: data.name,
            location,
        };
    }).filter(center => center.location); // Only include centers with a location

    if (helpCenters.length === 0) {
        // Fall back to mock data when Firestore help centers are not yet registered.
        helpCenters.push(...mockHelpCenters);
    }

    const genAiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!genAiKey) {
      return createFallbackRoute(input, helpCenters);
    }

    try {
      const {output} = await prompt({ ...input, helpCenters });
      return output!;
    } catch (error) {
      return createFallbackRoute(input, helpCenters);
    }
  }
);

function parseLocation(location: string) {
  const normalized = location.replace(/°/g, '').replace(/[NSEW]/gi, '');
  const parts = normalized.split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0].trim());
  const lng = Number(parts[1].trim());
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aTerm = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(aTerm), Math.sqrt(1 - aTerm));
}

function getDisasterAdvice(disasterType: string) {
  switch (disasterType.toLowerCase()) {
    case 'flood':
      return 'Avoid low-lying roads, riverbanks, and underpasses; head for higher ground and use major roads when possible.';
    case 'wildfire':
      return 'Move away from smoke and flames, avoid dry brush, and travel via cleared, open routes.';
    case 'earthquake':
      return 'Use main roads carefully, avoid damaged bridges or unstable structures, and keep away from falling hazards.';
    case 'tsunami':
      return 'Move inland and uphill immediately, avoiding the coastline and low-lying areas.';
    case 'cyclone':
      return 'Seek shelter inland, avoid flooded roads, and stay away from coastal and exposed zones.';
    default:
      return 'Follow major routes toward the chosen help center while avoiding visible hazards and unstable areas.';
  }
}

function createFallbackRoute(input: GetSafePathInput, centers: Array<{ name: string; location: string }>) {
  const current = parseLocation(input.currentLocation);
  let selectedCenter = centers[0];
  let destinationCoords = parseLocation(selectedCenter.location);

  if (current) {
    const nearest = centers.reduce(
      (best, center) => {
        const coords = parseLocation(center.location);
        if (!coords) return best;
        if (!best) {
          return { center, coords, dist: distance(current, coords) };
        }
        const dist = distance(current, coords);
        return dist < best.dist ? { center, coords, dist } : best;
      },
      null as null | { center: { name: string; location: string }; coords: { lat: number; lng: number }; dist: number }
    );

    if (nearest) {
      selectedCenter = nearest.center;
      destinationCoords = nearest.coords;
    }
  }

  if (!destinationCoords) {
    throw new Error('Could not determine destination coordinates for fallback safe path.');
  }

  return {
    destination: selectedCenter.name,
    destinationCoords,
    safePath: `From your current location, proceed directly toward ${selectedCenter.name} at coordinates ${destinationCoords.lat}, ${destinationCoords.lng}. ${getDisasterAdvice(input.disasterType)}`,
    estimatedTime: 'Estimated travel time depends on local conditions, typically 30-90 minutes for nearby help centers.',
    riskLevel: input.disasterSeverity === 'Extreme' ? 'High' : 'Moderate',
  };
}
