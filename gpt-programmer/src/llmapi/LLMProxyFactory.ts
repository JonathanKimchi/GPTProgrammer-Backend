// Factory pattern implementation:

import { OpenAiServiceProxy } from "./OpenAiServiceProxy";

export class LLMProxyFactory {
    // using llm name as key. Store the proxy class in a map
    private static llmProxyMap: Map<string, any> = new Map<string, any>(
        [
            ['openai', new OpenAiServiceProxy()]
        ]);

    public static getLLMProxy(llmName: string): any {
        return this.llmProxyMap.get(llmName);
    }
}
