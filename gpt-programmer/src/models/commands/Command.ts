export interface Command {
    type: string;
    command?: string;
    filePath?: string;
    content?: string;
}