import * as functions from "firebase-functions";
import { interactiveQuestionFlow } from "./gemini-config";

// Define the HTTP endpoint for the interactiveQuestionFlow function
export const api = functions.https.onRequest(async (req, res) => {
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
