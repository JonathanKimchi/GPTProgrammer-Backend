export abstract class BaseCommand {
    type: string;
    command?: string;
    filePath?: string;
    content?: string;
    static commandType: any;
  static documentation: any;
  
    constructor(type: string, command?: string, filePath?: string, content?: string) {
      this.type = type;
      this.command = command;
      this.filePath = filePath;
      this.content = content;
    }
  
    abstract execute(): void;
}
  