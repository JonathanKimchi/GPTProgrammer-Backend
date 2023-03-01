import { Command } from "./Command";


export interface BuildCommand extends Command {
    // TODO: deprecate the "type" field as it is redundant
    type: "build_command";
    command: string;
}