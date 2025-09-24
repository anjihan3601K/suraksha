// src/ai/flows/voice-activated-sos.ts
'use server';

/**
 * @fileOverview Implements the voice-activated SOS functionality.
 *
 * - voiceActivatedSOS - A function that triggers an SOS based on voice input.
 * - VoiceActivatedSOSInput - The input type for the voiceActivatedSOS function.
 * - VoiceActivatedSOSOutput - The return type for the voiceActivatedSOS function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceActivatedSOSInputSchema = z.object({
  voiceCommand: z
    .string()
    .describe("The user's voice command, which should trigger the SOS if it contains the activation keyword."),
  userDetails: z
    .string()
    .optional()
    .describe('User details like name and contact info for the SOS alert.'),
  locationData: z
    .string()
    .optional()
    .describe('Location information of the user for the SOS alert.'),
});
export type VoiceActivatedSOSInput = z.infer<typeof VoiceActivatedSOSInputSchema>;

const VoiceActivatedSOSOutputSchema = z.object({
  sosTriggered: z.boolean().describe('Indicates whether the SOS was triggered.'),
  alertDetails: z
    .string()
    .optional()
    .describe('Details about the SOS alert, including user details and location.'),
});
export type VoiceActivatedSOSOutput = z.infer<typeof VoiceActivatedSOSOutputSchema>;

export async function voiceActivatedSOS(input: VoiceActivatedSOSInput): Promise<VoiceActivatedSOSOutput> {
  return voiceActivatedSOSFlow(input);
}

const voiceSOSPrompt = ai.definePrompt({
  name: 'voiceSOSPrompt',
  input: {schema: VoiceActivatedSOSInputSchema},
  output: {schema: VoiceActivatedSOSOutputSchema},
  prompt: `You are an emergency assistant. Your task is to determine if a user's voice command is a request for help.

You must look for the following keywords: "help", "emergency", "sos".

If the voice command contains any of these keywords, you must trigger an SOS.
- Set 'sosTriggered' to true.
- Construct an 'alertDetails' message that includes the user's details and location.

If the voice command does NOT contain any of these keywords, you must NOT trigger an SOS.
- Set 'sosTriggered' to false.
- Leave 'alertDetails' empty.

Here are some examples:

User voice command: "I need help, there is a fire."
User details: "John Doe, 555-555-1234"
Location data: "123 Main St, Anytown"
Your output: { "sosTriggered": true, "alertDetails": "SOS triggered for John Doe (555-555-1234) at 123 Main St, Anytown." }

User voice command: "The sky is blue today."
User details: "Jane Smith, 555-555-5678"
Location data: "456 Oak Ave, Anytown"
Your output: { "sosTriggered": false }


Now, process the following request:

User voice command: "{{voiceCommand}}"
User details: "{{userDetails}}"
Location data: "{{locationData}}"
`,
});

const voiceActivatedSOSFlow = ai.defineFlow(
  {
    name: 'voiceActivatedSOSFlow',
    inputSchema: VoiceActivatedSOSInputSchema,
    outputSchema: VoiceActivatedSOSOutputSchema,
  },
  async input => {
    const {output} = await voiceSOSPrompt(input);
    return output!;
  }
);
