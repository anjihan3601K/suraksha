
'use server';
/**
 * @fileOverview An AI agent for translating UI text.
 *
 * - translateUI - A function that translates a list of strings to a target language.
 * - TranslateUIInput - The input type for the translateUI function.
 * - TranslateUIOutput - The return type for the translateUI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateUIInputSchema = z.object({
  texts: z.array(z.string()).describe('An array of UI text strings to be translated.'),
  targetLanguage: z.string().describe('The target language code (e.g., "hi" for Hindi, "ta" for Tamil).'),
});
export type TranslateUIInput = z.infer<typeof TranslateUIInputSchema>;

const TranslateUIOutputSchema = z.object({
  translatedTexts: z.array(z.string()).describe('The array of translated text strings, in the same order as the input.'),
});
export type TranslateUIOutput = z.infer<typeof TranslateUIOutputSchema>;

export async function translateUI(input: TranslateUIInput): Promise<TranslateUIOutput> {
  return translateUIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateUIPrompt',
  input: {schema: TranslateUIInputSchema},
  output: {schema: TranslateUIOutputSchema},
  prompt: `You are a UI translation expert. Your task is to translate a list of English UI strings into the specified target language.

**Target Language:** {{targetLanguage}}

**English Strings to Translate:**
{{#each texts}}
- "{{this}}"
{{/each}}

**Instructions:**
1.  Translate each string accurately and concisely for a user interface.
2.  Maintain the original order of the strings in your output.
3.  Return the translated strings as an array in the specified JSON output format.
`,
});

const translateUIFlow = ai.defineFlow(
  {
    name: 'translateUIFlow',
    inputSchema: TranslateUIInputSchema,
    outputSchema: TranslateUIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
