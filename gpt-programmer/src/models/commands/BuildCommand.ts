import { BaseCommand } from "./BaseCommand";

export class BuildCommand extends BaseCommand {
    static commandType = "build_command";
    static documentation = "This is a description of BuildCommand.";
  
    constructor(command: string) {
      super(BuildCommand.commandType, command);
    }
  
    execute() {
      // Implementation of BuildCommand
    }
}