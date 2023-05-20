import { readFileSync } from "fs";
import { addVariablesToCode, convertRawOutputToCommandList, dedupeFileList, getChatCompletion, getFileCommands, getInformationRequest } from "../CodeRunner";
import { FileCommand } from "../models/commands/FileCommand";
import { getBestFitApisForRequestedInfo } from "./APIInfoRetriever";

export async function getFileCommandsForRequests(fileRequests: FileCommand[], originalAppPrompt: any) {
    const fileCommands = [];
    const codePromises = [];
  
    // Create an array of promises for each file request
    for (let i = 0; i < fileRequests.length; i++) {
      const currentFileRequest = fileRequests[i];
      const otherFileRequests = fileRequests.slice(0, i).concat(fileRequests.slice(i + 1));
      const filePrompt = await getFileCommandPrompt(currentFileRequest, otherFileRequests, originalAppPrompt);
      const codePromise = getGeneratedCodeForPage(filePrompt).then((fileCode) => {
        console.log(`Promise ${i + 1} resolved`);
        return fileCode;
      });
      codePromises.push(codePromise);
    }
  
    // Resolve all the promises simultaneously
    const fileCodes = await Promise.all(codePromises);
  
    // Process each file code
    for (let i = 0; i < fileCodes.length; i++) {
      const fileCode = fileCodes[i];
      const requestedInfo = await getInformationRequest(fileCode);
      const bestFitApiInfo = await getBestFitApisForRequestedInfo(requestedInfo);
      const filteredFileCode = await addVariablesToCode(fileCode, bestFitApiInfo);
      const fileCommandList = await convertRawOutputToCommandList(filteredFileCode);
      fileCommands.push(...fileCommandList);
    }
  
    const finalFileCommands = dedupeFileList(fileRequests, fileCommands);
    return finalFileCommands;
  }
  

export async function getFileCommandPrompt(currentFileRequest: any, otherFileRequests: any[], originalAppPrompt: any) {
    // map over otherFileRequests to extract .content and join them into a single string
    const contextStrings = otherFileRequests.map(request => request.content).join(',\n');

    const promptTemplate = `
    App Description: ${originalAppPrompt}
    Page: ${currentFileRequest.content}
    Context: ${contextStrings}
    `
    return promptTemplate;
}

export async function getGeneratedCodeForPage(userChatRequest: string, chatHistory: any[] = []): Promise<string> {
    const prePrompt = readFileSync("src/prompts/page-generator-prompt.txt", "utf-8");
    const response = getChatCompletion(userChatRequest, chatHistory, prePrompt);
    return response;
}