/**
 * 
 * This class handles the generation of commands.
 * variables and functions:
 * - variable acceptedCommands: list of accepted commands
 * - variable prePrompt: string that is prepended to the prompt
 * - variable examples: list of example outputs that the AI can generate. prepended to the prompt after the prePrompt
 * - variable postPrompt: string that is appended to the prompt
 * - variable commandHandler: stores the CommandHandler object (optional)
 * - variable outputHandler: stores the OutputHandler object (optional)
 * 
 */

import { Command } from "../models/commands/Command";
import { CommandHandler } from "../handlers/commands/CommandHandler";
import { OutputHandler } from "../handlers/outputs/OutputHandler";
import { LLMProxy } from "../llmapi/LLMProxy";
import { LLMProxyFactory } from "../llmapi/LLMProxyFactory";
import { LLM_LABEL, LLM_MODEL } from "../environment/EnvConfig";
import { LLMPlugin } from "../plugins/LLMPlugin";

export class CommandGenerator {
    public COMMAND_GENERATOR_TYPE: string;
    // list of plugins that are accepted
    protected acceptedPlugins: LLMPlugin[] = [];
    // string that is prepended to the prompt
    protected prePrompt: string = "";
    // string that is appended to the prompt
    protected postPrompt: string = "";
    // list of example outputs that the AI can generate. prepended to the prompt after the prePrompt
    protected examples: string[] = [];
    // stores the CommandHandler object (optional)
    protected commandHandler?: CommandHandler;
    // stores the OutputHandler object (optional)
    protected outputHandler?: OutputHandler;
    // stores the LLM label
    protected llmLabel: string;
    protected llmProxy: LLMProxy;
    protected commandGeneratorDescription: string = "";

    // constructor
    constructor(
            acceptedPlugins: LLMPlugin[], prePrompt: string, 
            postPrompt: string, examples: string[], 
            llmLabel:string = LLM_LABEL, commandHandler: any = {}, outputHandler: OutputHandler = "test") {
        this.acceptedPlugins = acceptedPlugins;
        this.prePrompt = prePrompt;
        this.postPrompt = postPrompt;
        this.examples = examples;
        this.commandHandler = commandHandler;
        this.outputHandler = outputHandler;
        this.llmLabel = llmLabel;
        this.llmProxy = LLMProxyFactory.getLLMProxy(llmLabel);
    }

    public getCommandGeneratorDescription(): string {
        return this.commandGeneratorDescription;
    }

    public async generateCommandList(prompt: string): Promise<Command[]> {
        // generate raw AI output
        let rawOutput: string = await this.generateAiOutput(prompt);
        // serialize raw AI output into a list of commands
        let commandList: Command[] = this.getCommandListFromRawOutput(rawOutput);
        return commandList;
    }

    /**
     * this function generates raw AI output using llm api.
     * @param prompt the user provided prompt
     * @returns the raw AI output
     */
    public async generateAiOutput(prompt: string): Promise<string> {
        let fullPrePrompt: string = this.getPrePrompt() + 
            this.getCommandDocumentationFromPlugins() + 
            this.getExamplesAsString();

        let rawOutput: string = await this.llmProxy.generateChatCompletion(LLM_MODEL, fullPrePrompt, prompt, [], {});
        return rawOutput;
    }

    /**
     * this function serializes raw AI output into a list of commands
     * @param rawOutput the raw AI output
     * @returns a list of commands
     */
    protected getCommandListFromRawOutput(rawOutput: string): Command[] {

        return [];
    }

    public getCommandDocumentationFromPlugins(): string[] {
        // get the accepted commands from the plugins
        let acceptedCommandsDocumentation: string[] = [];
        for (let plugin of this.acceptedPlugins) {
            acceptedCommandsDocumentation = acceptedCommandsDocumentation.concat(plugin.getPluginDocumentation());
        }
        return acceptedCommandsDocumentation;
    }

    public getExamples(): string[] {
        return this.examples;
    }

    public getExamplesAsString(): string {
        let examplesString: string = "";
        for (let example of this.examples) {
            examplesString += example + "\n";
        }
        return examplesString;
    }

    public setExamples(examples: string[]): void {
        this.examples = examples;
    }

    public getPrePrompt(): string {
        return this.prePrompt;
    }

    public setPrePrompt(prePrompt: string): void {
        this.prePrompt = prePrompt;
    }

    public getPostPrompt(): string {
        return this.postPrompt;
    }

    public setPostPrompt(postPrompt:
        string): void {
        this.postPrompt = postPrompt;
    }

    public getType(): string {
        return this.COMMAND_GENERATOR_TYPE;
    }

    public getAcceptedPlugins(): LLMPlugin[] {
        return this.acceptedPlugins;
    }
}