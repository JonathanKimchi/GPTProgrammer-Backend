export interface ExecuteCodeRequest {
    requestedInformation?: any;
    generatedCodeFolder?: string;
    prompt?: string;
    applyExtraStyling: string;
    code?: string;
    pid?: string;
}