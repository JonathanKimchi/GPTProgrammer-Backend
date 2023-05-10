/**
 * Class that takes in a list of commands, as well as a list of plugins and 
 * executes the commands using the plugins if the plugins can handle the commands.
 */

import { CommandGenerator } from "../../generators/CommandGenerator";
import { Command } from "../../models/commands/Command";
import { LLMPlugin } from "../../plugins/LLMPlugin";

export class CommandHandler {
    protected commandGenerator: CommandGenerator;
    // list of commands that are accepted
    protected acceptedCommands = [];
    // list of plugins that are accepted
    protected acceptedPlugins: LLMPlugin[] = [];
    // stores the LLM label
    protected llmLabel: string;

    // constructor
    constructor(commandGenerator: CommandGenerator) {
        this.commandGenerator = commandGenerator;
        this.acceptedPlugins = commandGenerator.getAcceptedPlugins();
    }

    // function that takes in a list of commands and executes them
    public async executeCommandList(commandList: Command[]): Promise<string> {
        let output: string = "";
        for (let command of commandList) {
            output += await this.executeCommand(command);
        }
        return output;
    }

    // function that takes in a command and executes it
    public async executeCommand(command: Command): Promise<string> {
        let output: string = "";
        for (let plugin of this.acceptedPlugins) {
            if (plugin.canHandleCommand(command)) {
                output += await plugin.handleCommand(command);
            }
        }
        return output;
    }
}
