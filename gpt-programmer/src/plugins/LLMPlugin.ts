/**
 * interface LLMPlugin
 * defines the interface for a plugin.
 * plugin is a class that can handle commands.
 */
import { Command } from "../models/commands/Command";

export interface LLMPlugin {

    // function that takes in a command and executes it
    handleCommand(command: Command): Promise<string>;

    // function that returns the name of the plugin
    getPluginName(): string;

    // function that returns the list of commands that the plugin can handle
    getAcceptedCommands(): string[];

    // function that returns whether the plugin can handle a command
    canHandleCommand(command: Command): boolean;

    // function that returns the documentation for the plugin
    getPluginDocumentation(): string[];
}
