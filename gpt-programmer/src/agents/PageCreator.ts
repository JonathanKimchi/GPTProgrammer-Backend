import { readFileSync } from "fs";
import { convertRawOutputToCommandList, dedupeFileList, getChatCompletion, getFileCommands } from "../CodeRunner";
import { FileCommand } from "../models/commands/FileCommand";

export async function getFileCommandsForRequests(fileRequests: FileCommand[], originalAppPrompt: any) { 

    const fileCommands = [];
    // for every file request, seperate the current
    // fileRequest from the rest of the fileRequests
    for (let i = 0; i < fileRequests.length; i++) {
        const currentFileRequest = fileRequests[i];
        const otherFileRequests = fileRequests.slice(0, i).concat(fileRequests.slice(i + 1));
        const filePrompt = await getFileCommandPrompt(currentFileRequest, otherFileRequests, originalAppPrompt);
        const fileCode = await getGeneratedCodeForPage(filePrompt);
        const fileCommandList = await convertRawOutputToCommandList(fileCode);
        fileCommands.push(fileCommandList[0]);
    }
    const finalFileCommands = dedupeFileList(fileRequests, fileCommands);
    return finalFileCommands;
}

export async function getFileCommandPrompt(currentFileRequest: any, otherFileRequests: any[], originalAppPrompt: any) {
    const promptTemplate = `
    App Description: ${originalAppPrompt}
    Page: ${currentFileRequest.content}
    Context: ${otherFileRequests}
    `
    return promptTemplate;
}
export async function getGeneratedCodeForPage(userChatRequest: string, chatHistory: any[] = []): Promise<string> {
    const prePrompt = readFileSync("src/prompts/page-generator-prompt.txt", "utf-8");
    const response = getChatCompletion(userChatRequest, chatHistory, prePrompt);
    return response;
}