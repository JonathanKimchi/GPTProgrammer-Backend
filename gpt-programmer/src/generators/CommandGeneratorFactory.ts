/**
 * Factory for command generators
 */

import { CommandGenerator } from "./CommandGenerator";
import { Command } from "../models/commands/Command";
import { FrontendCommandGenerator } from "./FrontendCommandGenerator";


export class CommandGeneratorFactory {
    static readonly COMMAND_GENERATOR_MAP = {
        "frontend": new FrontendCommandGenerator()
    }
    // function that returns a list of command generators
    public static getCommandGeneratorList(): CommandGenerator[] {
        let commandGeneratorList: CommandGenerator[] = [];
        for (let commandGeneratorName in this.COMMAND_GENERATOR_MAP) {
            commandGeneratorList.push(new this.COMMAND_GENERATOR_MAP[commandGeneratorName]());
        }
        return commandGeneratorList;
    }

    // function that returns a list of keys for the command generator map
    public static async getCommandGeneratorKeyList(): Promise<string[]> {
        return Object.keys(this.COMMAND_GENERATOR_MAP);
    }

    // function that returns a command generator
    public static getCommandGenerator(commandGeneratorName: string): CommandGenerator {
        return new this.COMMAND_GENERATOR_MAP[commandGeneratorName]();
    }

    // function that returns the map of command generators
    public static getCommandGeneratorMap(): any {
        return this.COMMAND_GENERATOR_MAP;
    }
}
