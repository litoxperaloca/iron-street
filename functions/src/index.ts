import * as functions from "firebase-functions";
import { interactiveQuestionFlow } from "./gemini-config";
// Define the HTTP endpoint for the ironBot function
export const ironBot = functions.https.onRequest((req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Check API key
  const VALID_API_KEY = "AIzaSyDBjRvntQjArNGIWjboRX7jFYUUMCAkj_4"; // Replace with your actual API key

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== VALID_API_KEY) {
    res.status(403).send('Forbidden');
    return;
  }

  // Your chatbot logic here
  const message = req.body.message;
  if (!message) {
    res.status(400).send('Bad Request: No message provided');
    return;
  }

  const responseMessage = `You said: ${message}. Here's a safety driving tip: Always wear your seatbelt!`;
  res.status(200).json({ reply: responseMessage });
});

// Define the HTTP endpoint for the interactiveQuestionFlow function
export const api = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for the main request
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { question, previousInteraction } = req.body;
    const response = await interactiveQuestionFlow(question, previousInteraction);
    res.json(response);
  } catch (error) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.toString();
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    res.status(500).send(errorMessage);
  }
});
