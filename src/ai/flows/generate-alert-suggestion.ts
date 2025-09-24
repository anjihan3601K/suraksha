'use server';
/**
 * @fileOverview An AI agent for generating disaster alert suggestions.
 *
 * - generateAlertSuggestion - A function that creates a draft alert for an admin.
 * - GenerateAlertSuggestionInput - The input type for the generateAlertSuggestion function.
 * - GenerateAlertSuggestionOutput - The return type for the generateAlertSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAlertSuggestionInputSchema = z.object({
  disasterType: z.string().describe('The type of disaster occurring (e.g., Wildfire, Earthquake).'),
  severity: z.string().describe('The severity of the disaster (e.g., Low, Moderate, High).'),
});
export type GenerateAlertSuggestionInput = z.infer<typeof GenerateAlertSuggestionInputSchema>;

const GenerateAlertSuggestionOutputSchema = z.object({
  title: z.string().describe('A clear, concise title for the alert.'),
  message: z.string().describe('A detailed, actionable message for users, including what to do and where to find more information.'),
});
export type GenerateAlertSuggestionOutput = z.infer<typeof GenerateAlertSuggestionOutputSchema>;

export async function generateAlertSuggestion(input: GenerateAlertSuggestionInput): Promise<GenerateAlertSuggestionOutput> {
  return generateAlertSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAlertSuggestionPrompt',
  input: {schema: GenerateAlertSuggestionInputSchema},
  output: {schema: GenerateAlertSuggestionOutputSchema},
  prompt: `You are an expert emergency communications officer. Your task is to draft a public safety alert based on the provided disaster information. The tone should be clear, authoritative, and reassuring.

**Disaster Information:**
- **Type:** {{{disasterType}}}
- **Severity:** {{{severity}}}

**Your Task:**
1.  **Create a Title:** Write a short, impactful title for the alert.
2.  **Write a Message:** Compose a detailed message. It must include:
    - A clear statement of the situation.
    - Specific, actionable instructions for what people should do (e.g., "evacuate immediately," "shelter in place," "stay off the roads").
    - Mention that they should monitor official channels for further updates.

Provide the output in the specified format.`,
});

const generateAlertSuggestionFlow = ai.defineFlow(
  {
    name: 'generateAlertSuggestionFlow',
    inputSchema: GenerateAlertSuggestionInputSchema,
    outputSchema: GenerateAlertSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
