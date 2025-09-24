'use server';
/**
 * @fileOverview An AI agent for assessing safety risk.
 *
 * - assessSafetyRisk - A function that assesses the safety risk for a given location.
 * - AssessSafetyRiskInput - The input type for the assessSafetyRisk function.
 * - AssessSafetyRiskOutput - The return type for the assessSafetyRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessSafetyRiskInputSchema = z.object({
  location: z.string().describe('The user\'s current location (e.g., address or GPS coordinates).'),
  activeAlerts: z.array(z.object({
    title: z.string(),
    severity: z.string(),
  })).describe('A list of active disaster alerts in the area.'),
});
export type AssessSafetyRiskInput = z.infer<typeof AssessSafetyRiskInputSchema>;

const AssessSafetyRiskOutputSchema = z.object({
  safetyScore: z.number().min(0).max(100).describe('A numerical safety score from 0 (very dangerous) to 100 (very safe).'),
  riskLevel: z.enum(['Low', 'Moderate', 'High', 'Extreme']).describe('The overall assessed risk level.'),
  recommendation: z.string().describe('A brief, actionable recommendation for the user.'),
});
export type AssessSafetyRiskOutput = z.infer<typeof AssessSafetyRiskOutputSchema>;

export async function assessSafetyRisk(input: AssessSafetyRiskInput): Promise<AssessSafetyRiskOutput> {
  return assessSafetyRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessSafetyRiskPrompt',
  input: {schema: AssessSafetyRiskInputSchema},
  output: {schema: AssessSafetyRiskOutputSchema},
  prompt: `You are a sophisticated AI risk analyst for a public safety application. Your task is to assess the safety of a specific location based on active alerts and provide a clear, concise safety score and recommendation.

**User's Location:**
- {{{location}}}

**Active Alerts:**
{{#if activeAlerts}}
{{#each activeAlerts}}
- **{{title}}** (Severity: {{severity}})
{{/each}}
{{else}}
- No active alerts.
{{/if}}

**Your Analysis Task:**
1.  **Evaluate Risk:** Based on the user's location and the provided alerts, determine the immediate risk. Consider the severity and type of disaster. For example, a "High" severity "Wildfire" alert poses an extreme risk. If there are no alerts, the risk is generally "Low". Multiple alerts should increase the risk.
2.  **Calculate Safety Score:** Convert the risk into a numerical score from 0 (most dangerous) to 100 (safest).
    -   Low Risk: 80-100
    -   Moderate Risk: 50-79
    -   High Risk: 20-49
    -   Extreme Risk: 0-19
3.  **Determine Risk Level:** Categorize the score into 'Low', 'Moderate', 'High', or 'Extreme'.
4.  **Formulate a Recommendation:** Provide a short, clear, and actionable piece of advice. For "Low" risk, it should be about staying informed. For "Moderate" or "High" risk, it should be about preparation and monitoring. For "Extreme" risk, it should be a direct call to action, like "Evacuate immediately if instructed."

Provide the output in the specified JSON format.`,
});

const assessSafetyRiskFlow = ai.defineFlow(
  {
    name: 'assessSafetyRiskFlow',
    inputSchema: AssessSafetyRiskInputSchema,
    outputSchema: AssessSafetyRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
