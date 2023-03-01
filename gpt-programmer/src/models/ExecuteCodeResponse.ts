export interface ExecuteCodeResponse {
    // The result of the execution.
    result: string;
    code: string;
    requestedInformation?: any;
    isFinished: boolean;
    error?: string;
}