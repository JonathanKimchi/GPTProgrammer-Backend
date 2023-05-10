// base class for LLM proxy

export abstract class LLMProxy {
    public abstract generateChatCompletion(model: string, prePrompt: string, userRequest: string, messages: any[], options: any): Promise<string>;
}