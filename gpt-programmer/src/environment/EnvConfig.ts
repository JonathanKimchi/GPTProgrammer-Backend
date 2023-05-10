

export function isDevelopment() {
    if (process.env.ENV_STAGE === 'development' || process.env.ENV_STAGE === 'test') {
        return true;
    }
    return false;
}

export const LLM_LABEL = "openai";
export const LLM_MODEL = "gpt-4";