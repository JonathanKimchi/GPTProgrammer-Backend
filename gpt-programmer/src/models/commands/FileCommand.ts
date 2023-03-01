import { Command } from "./Command";

export interface FileCommand extends Command {
    type: "file_command";
    filePath: string;
    content: string;
}