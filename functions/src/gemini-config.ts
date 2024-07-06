import { generate } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { firebase } from "@genkit-ai/firebase";
import { firebaseAuth } from "@genkit-ai/firebase/auth";
import { onFlow } from "@genkit-ai/firebase/functions";
import { geminiPro, vertexAI } from "@genkit-ai/vertexai";
import * as z from "zod";

configureGenkit({
  plugins: [
    firebase(),
    vertexAI({ location: 'us-central1' }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

export const interactiveQuestionFlow = onFlow(
  {
    name: "interactiveQuestionFlow",
    inputSchema: z.object({
      question: z.string(),
      previousInteraction: z.array(z.object({
        question: z.string(),
        answer: z.string()
      })).optional()
    }),
    outputSchema: z.object({
      answer: z.string(),
      interactionHistory: z.array(z.object({
        question: z.string(),
        answer: z.string()
      }))
    }),
    authPolicy: firebaseAuth((user) => {
      if (!user.email_verified) {
        throw new Error("Verified email required to run flow");
      }
    }),
  },
  async (input) => {
    const prompt = input.previousInteraction ?
      input.previousInteraction.map(inter => `Q: ${inter.question}\nA: ${inter.answer}`).join('\n') + `\nQ: ${input.question}\nA:` :
      `Q: ${input.question}\nA:`;

    const llmResponse = await generate({
      model: geminiPro,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    const answer = llmResponse.text();

    const newInteraction = {
      question: input.question,
      answer: answer
    };

    const interactionHistory = input.previousInteraction ? [...input.previousInteraction, newInteraction] : [newInteraction];

    return {
      answer: answer,
      interactionHistory: interactionHistory
    };
  }
);
