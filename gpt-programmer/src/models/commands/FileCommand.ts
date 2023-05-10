import { BaseCommand } from "./BaseCommand";

export class FileCommand extends BaseCommand {
    static commandType = "file_command";
    static documentation = "This is a description of FileCommand.";
  
    constructor(filePath: string, content: string) {
      super(FileCommand.commandType, undefined, filePath, content);
    }
  
    execute() {
      // Implementation of FileCommand
    }
  }