# **App Name**: Resilience Hub

## Core Features:

- Alert Broadcasting: Allow officials to broadcast alerts to all users. Only authenticated officials can trigger this function.
- Emergency SOS: Send user details and location to officials via voice, gesture or dedicated buttons. This will queue alerts when offline and send once a connection is established. Voice based triggers LLM tool that uses reasoning to activate
- I Am Safe Reporting: Update the admin panel dynamically to indicate the user's safe status.
- Photo and Text Reporting: Allow users to send photos and descriptions to officials with offline support.
- Safe Path Guidance: Display the safest evacuation route dynamically (MVP: preset paths; future: AI-calculated).
- Community Help: Allow users to mark 'I Can Help' or 'I Need Help' with map-based interface, storing locally, for support without an internet connection
- Authentication: Login/Signup for normal users via OAuth and credentials. Officials database with admin access via credentials.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5), symbolizing stability and trust in crises.
- Background color: Light blue (#E8EAF6), providing a calm and reliable base.
- Accent color: Vivid orange (#FF5722), for high-visibility alerts and action items.
- Body and headline font: 'PT Sans', a humanist sans-serif font for clarity and legibility in critical information display.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use clear, universal icons for alerts and actions, ensuring comprehension in stressful situations.
- Prioritize critical information (alerts, SOS) at the top, in a clear, single-column layout.
- Use subtle animations to confirm actions and draw attention to alerts without overwhelming the user.