import { detectIntent } from "./intentDetector.js";
import { buildAthronContext } from "./contextBuilder.js";
import { generateAthronResponse } from "./responseEngine.js";
import { saveConversation } from "./conversationMemory.js";

export async function askAthron(message, userId) {
  const intent = detectIntent(message);
  const context = await buildAthronContext(intent, userId);
  const response = await generateAthronResponse(message, intent, context);

  // persist
  await saveConversation({ userId, message, response: response.message, intent });

  return {
    message: response.message,
    intent,
    actions: response.actions || response.data || [],
    data: context,
    suggestions: response.suggestions || [],
  };
}
