import { Command } from "./Command";

export interface RunCommand extends Command {
    type: "run_command";
    command: string;
}