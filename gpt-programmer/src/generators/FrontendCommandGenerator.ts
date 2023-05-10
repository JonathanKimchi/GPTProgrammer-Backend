/**
 * 
 * A class that handles the generation of frontend commands.
 * This class extends a CommandGenerator class.
 * variables and functions:
 * - variable acceptedCommands: list of accepted commands
 * - variable prePrompt: string that is prepended to the prompt
 * - variable examples: list of example outputs that the AI can generate. prepended to the prompt after the prePrompt
 * - variable postPrompt: string that is appended to the prompt
 * - variable commandHandler: stores the CommandHandler object (optional)
 * - variable outputHandler: stores the OutputHandler object (optional)
 *  outputHandler is used to handle the output of the commands.
 *  output of the commands come in the form of an output object.
 * 
 * - variable prompt: string that is the prompt (inputted by caller)
 * - function generateAiOutput: generates raw AI output of command list
 * - function generateCommandList: serializes raw AI output into a list of commands
 * - function 
 */

import { CommandGenerator } from "./CommandGenerator";
import { Command } from "../models/commands/Command";
import { BuildCommand } from "../models/commands/BuildCommand";
import { RunCommand } from "../models/commands/RunCommand";
import { FileCommand } from "../models/commands/FileCommand";
import { CommandHandler } from "../handlers/commands/CommandHandler";
import { OutputHandler } from "../handlers/outputs/OutputHandler";
import { readFileSync } from "fs";
import { CodeRunnerPlugin } from "../plugins/CodeRunnerPlugin";
import { LLMPlugin } from "../plugins/LLMPlugin";

export class FrontendCommandGenerator extends CommandGenerator {

    // constructor
    constructor(commandHandler?: CommandHandler, outputHandler?: OutputHandler) {
        const acceptedPlugins: LLMPlugin[] = [new CodeRunnerPlugin()];
        // read preprompt from frontend-prompt.txt
        const prePrompt = readFileSync("../prompts/frontend-prompt.txt", "utf-8");
        const postPrompt = "";
        const examples = [];
        super(acceptedPlugins, prePrompt, postPrompt, examples);
        if (commandHandler) {
            this.commandHandler = commandHandler;
        }
        if (outputHandler) {
            this.outputHandler = outputHandler;
        }

        this.COMMAND_GENERATOR_TYPE = "frontend";

        this.commandGeneratorDescription = 
        `
        Label: FrontendGenerator
        Description: FrontendGenerator is a frontend developer. Use FrontendGenerator 
        when you want to build a frontend application, whether that be a website or a mobile app.
        When you want to use FrontendGenerator, send a message to the AI with the following format:
        "Create a frontend application using <frontend framework> that <does something>. It should <list of descriptions>."
        `
    }
}