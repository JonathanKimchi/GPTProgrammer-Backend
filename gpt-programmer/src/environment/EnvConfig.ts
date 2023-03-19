

export function isDevelopment() {
    if (process.env.ENV_STAGE === 'development' || process.env.ENV_STAGE === 'test') {
        return true;
    }
    return false;
}