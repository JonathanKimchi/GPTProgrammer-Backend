export interface ExecuteCodeResponse {
    // The result of the execution.
    result?: string;
    code: string;
    requestedInformation?: any;
    generatedCodeFolder?: string;
    pid?: string;
    isFinished?: boolean;
    error?: string;
}