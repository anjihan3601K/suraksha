'use server';
/**
 * @fileOverview An AI agent for translating a single alert's content.
 *
 * - translateAlert - A function that translates an alert's title and content.
 * - TranslateAlertInput - The input type for the translateAlert function.
 * - TranslateAlertOutput - The return type for the translateAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateAlertInputSchema = z.object({
  title: z.string().describe('The title of the alert.'),
  content: z.string().describe('The content of the alert message.'),
  targetLanguage: z.string().describe('The target language code (e.g., "hi" for Hindi).'),
});
export type TranslateAlertInput = z.infer<typeof TranslateAlertInputSchema>;

const TranslateAlertOutputSchema = z.object({
  translatedTitle: z.string().describe('The translated title.'),
  translatedContent: z.string().describe('The translated content.'),
});
export type TranslateAlertOutput = z.infer<typeof TranslateAlertOutputSchema>;

export async function translateAlert(input: TranslateAlertInput): Promise<TranslateAlertOutput> {
  return translateAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateAlertPrompt',
  input: {schema: TranslateAlertInputSchema},
  output: {schema: TranslateAlertOutputSchema},
  prompt: `You are a translation expert. Your task is to translate an emergency alert's title and content into the specified target language.

**Target Language:** {{targetLanguage}}

**Alert to Translate:**
- **Title:** "{{title}}"
- **Content:** "{{content}}"

**Instructions:**
1.  Translate the title and content accurately.
2.  Return the translated text in the specified JSON output format.
`,
});

const translateAlertFlow = ai.defineFlow(
  {
    name: 'translateAlertFlow',
    inputSchema: TranslateAlertInputSchema,
    outputSchema: TranslateAlertOutputSchema,
  },
  async input => {
    // Add a small delay to help with rate limiting on the client side.
    await new Promise(resolve => setTimeout(resolve, 200)); 
    const {output} = await prompt(input);
    return output!;
  }
);
