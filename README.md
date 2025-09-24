# AlertNet

This is a Next.js application built with Firebase Studio. It's a full-stack disaster alert and help system designed to keep communities safe and connected during emergencies.

## Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine for development, testing, and deployment.

### Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)

### 1. Set Up Environment Variables

This project uses Genkit for AI features, which requires a Google AI API key. The Firebase configuration is already included in the project, so you don't need to set it up.

1.  Create a file named `.env` in the root of your project directory.
2.  Go to the [Google AI Studio](https://aistudio.google.com/app/apikey) to get an API key.
3.  Add the following line to your `.env` file, replacing `<YOUR_API_KEY>` with the key you just obtained:
    ```
    GEMINI_API_KEY=<YOUR_API_KEY>
    ```

### 2. Install Dependencies

Open a terminal in your project's root directory and run the following command to install all the necessary packages:

```bash
npm install
```

### 3. Run the Development Server

Once the installation is complete, you can start the local development server:

```bash
npm run dev
```

This will start two processes:
- The Next.js application, typically available at **http://localhost:9002**.
- The Genkit development server for your AI flows.

Open [http://localhost:9002](http://localhost:9002) in your browser to see your application running!

### 4. Deploying

You can deploy this application to any platform that supports Next.js, such as Vercel, Netlify, or Firebase App Hosting. The `apphosting.yaml` file is included for easy deployment to Firebase App Hosting.
