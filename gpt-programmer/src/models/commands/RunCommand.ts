import { BaseCommand } from "./BaseCommand";

export class RunCommand extends BaseCommand {
    static commandType = "run_command";
    static documentation = "This is a description of RunCommand.";
  
    constructor(command: string) {
      super(RunCommand.commandType, command);
    }
  
    execute() {
      // Implementation of RunCommand
    }
  }