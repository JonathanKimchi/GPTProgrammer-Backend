// OpenAiServiceProxy class.

import { LLMProxy } from "./LLMProxy";
import { Configuration, OpenAIApi } from "openai";
import dotenv from 'dotenv';

dotenv.config({path: '.env'});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export class OpenAiServiceProxy extends LLMProxy {
    constructor() {
        super();
    }

    async generateChatCompletion(model: string, prePrompt: string, userRequest: string, messages: any[] = [], options: any = {}): Promise<string> {
        const systemContext = {
          "role": "system",
          "content": prePrompt,
        }
        const userMessage = {
          "role": "user",
          "content": userRequest+"\nOutput:",
        }
        const existingMessages = []
        existingMessages.push(systemContext);
        existingMessages.push(...messages);
        existingMessages.push(userMessage);
      
        const response = await openai.createChatCompletion({
          model,
          messages: existingMessages,
          ...options
        });
      
        return response.data.choices[0].message.content;
      }
}