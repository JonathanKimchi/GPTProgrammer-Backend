import fs, { readFileSync } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { resolve } from 'path';
import treeKill from 'tree-kill';

import { Configuration, OpenAIApi } from "openai";

import { myCache } from './server';

import dotenv from 'dotenv';
import { Command } from './models/commands/Command';
import { BuildCommand } from './models/commands/BuildCommand';
import { FileCommand } from './models/commands/FileCommand';
import { ExecuteCodeResponse } from './models/ExecuteCodeResponse';
import { BuildOutput } from './models/BuildOutput';
dotenv.config({path: '.env'});

const LLM_MODEL = 'gpt-4';
const MAX_TOKENS = 5000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const runCommand = async (command, folderName) => {
  console.log(`Running command: ${command} in folder: ${folderName}`);
  return new Promise((resolve, reject)=> {
    exec(`cd ${folderName} && ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      resolve(stdout);
    })
  });
};

const runBuildCommand = async (command, folderName): Promise<BuildOutput> => {
  console.log(`Running Build command: ${command} in folder: ${folderName}`);
  return new Promise((resolve, reject)=> {
    var buildProcess = exec(`cd ${folderName} && echo y | ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.error(`stderr: ${stderr}`);
    });
    let output = '';
    // store the pid of the process in myCache and have the entry expire after 5 minutes
    myCache.set(buildProcess.pid.toString(), buildProcess.pid.toString(), 60*5);

    buildProcess.stdout.on('data', function(data) {
      console.log(data);
      output+=data.toString();
      if (output.includes('Your native app')) {
        // server successfully started. Print.
        resolve({
          output: output,
          childProcess: buildProcess,
          pid: buildProcess.pid,
        });
      }
    });
    let errorOutput = '';
    buildProcess.stderr.on('data', function(data) {
      if (data.toString().includes('WARNING')) {
        return;
      }
      console.error(data);
      errorOutput+=data.toString();
      // reject(errorOutput);
    });

    setInterval(() => {
      console.log('Checking if build process with pid: ', buildProcess.pid, ' is still cached');
      if (!myCache.get(buildProcess.pid.toString())) {
        console.log('Killing build process');
        treeKill(buildProcess.pid, 'SIGTERM');
      }
    }, 60*1000 * 6);
  });
};


const createFile = (filepath, content) => {
  console.log(`Creating file: ${filepath}`);
  const baseFilePath = path.dirname(filepath);
  createDirectory(baseFilePath);
  fs.writeFileSync(path.join(filepath), content);
};

const isRunnableCode = (command) => {
  var result = true;
  if (command === "```") {
    result = false;
  }
  return result;
}

function filterBuildOutput(buildOutput) {
  const frontTrimmed = buildOutput.substring(buildOutput.indexOf('exp'));
  const finalResult = frontTrimmed.substring(0, frontTrimmed.indexOf('\n'));
  return finalResult;
}

const createDirectory = (filePath) => {
    const dirName = filePath;
    if (fs.existsSync(dirName)) {
      console.log('directory exists! ', dirName);
      return;
    }
    console.log('Creating directory: ' + filePath);
    fs.mkdirSync(dirName, { recursive: true });
};

// const folderName = process.argv[2];
// const inputFile = process.argv[3];

let numRetries = 0;

export function getInformationRequest(generatedCode: string): any {
  let lines = generatedCode.split('\n');
  let requestedInformation = {};

  for (let command of lines) {
    if (command.startsWith('request_info:')) {
      console.log('request for info found. request_info: ', command);
      let parts = command.split('--');
      let promptInfo = parts[0].slice(13).trim();
      let varName = parts[1].trim();
      requestedInformation[promptInfo] = varName;
    }
  }

  return requestedInformation;
}

/**
 * This function takes in a list of objects and returns a string
 * @param {Array} commandList
 * @returns {string}
 */
export function convertCommandsToRawOutput(commandList) {
  let outputString = '';
  for (let command of commandList) {
    if (command.type === 'build_command') {
      outputString += `build_command: ${command.command}\n`;
    } else if (command.type === 'run_command') {
      outputString += `run_command: ${command.command}\n`;
    } else if (command.type === 'new_file') {
      outputString += `new_file: ${command.filePath}\n`;
      outputString += `${command.content}\n`;
      outputString += `end new_file\n`;
    }
  }
  return outputString;
}

/**
 * This function takes in a string and returns a list of commands
 * @param {string} inputString
 * @returns {Array}
 */
export function convertRawOutputToCommandList(inputString: string): Array<any> {
  const inputLines = inputString.trim().split('\n');
  const commandList = [];
  let currentFile: any = {};
  let isNewFile = false;
  let lineData: any = {};

  for (let command of inputLines) {
    lineData = {};
    console.log(command);
    if (command.startsWith('build_command:')) {
      lineData.type = 'build_command';
      lineData.command = command.slice(15).trim();
      commandList.push(lineData);
    } else if (command.startsWith('run_command:')) {
      lineData.type = 'run_command';
      lineData.command = command.slice(13).trim();
      commandList.push(lineData);
    } else if (command.startsWith('new_file:')) {
      currentFile.type = 'new_file';
      currentFile.filePath = command.slice(10).trim();
      isNewFile = true;
      currentFile.content = '';
    } else if (isNewFile) {
      if (command.startsWith('end new_file')) {
        isNewFile = false;
        commandList.push(currentFile);
        currentFile = {};
        continue;
      }
      if (!isRunnableCode(command)) {
        continue;
      }
      console.log(command);
      currentFile.content += (command + '\n');
    } else {
      console.log('Irrelevant command.');
    }
  }
  console.log("Command List:");
  console.log(commandList);

  return commandList;
}

async function processInput(inputString) {
  return convertRawOutputToCommandList(inputString);
}

export function addVariablesToCode(generatedCode: string, requestedInformation: Map<string, string>) {
  generatedCode = generatedCode.replace('request_info: ', '');
  const requestedInformationArray = Object.entries(requestedInformation);
  for (let [key, value] of requestedInformationArray) {
    let regex = new RegExp(`{{${key}}}`, 'g');
    generatedCode = generatedCode.replace(regex, value);
  }
  return generatedCode;
}



/**
 * This function takes in a list of commands and runs the commands
 */
async function interpretInput(commandList: Command[], folderName = "test"): Promise<ExecuteCodeResponse> {
  let currentDirectory = folderName;

  let commandsRun: Command[] = [];
  let lastLineRun = '';
  try {
    for (let commandObject of commandList) {
      console.log(commandObject);
      
      commandsRun.push(commandObject);

      const { type, command, filePath, content } = commandObject;

      switch (type) {
        case 'build_command':
          console.log('Command found! Running...');
          lastLineRun = command;
          const buildOutput: BuildOutput = await runBuildCommand(command, currentDirectory);
          const qrCodeUri = filterBuildOutput(buildOutput.output);
          const rawCode = convertCommandsToRawOutput(commandList);
          let response: ExecuteCodeResponse = {
            result: qrCodeUri,
            pid: buildOutput.pid.toString(),
            code: rawCode, // TODO: Remove code field.
            generatedCodeFolder: folderName,
          };
          return response;
        case 'run_command':
          console.log('Command found! Running...');
          lastLineRun = command;
          if (command.startsWith('cd ')) {
            currentDirectory = path.resolve(currentDirectory, command.substring(3));
            console.log(`Changed current directory to ${currentDirectory}`);
          } 
          else {
            await runCommand(command, currentDirectory);
          }
          break;
        case 'new_file':
          console.log('File found! Creating...');
          createFile(path.join(currentDirectory, filePath), content);
          break;
        default:
          console.log('Irrelevant command.');
      }
    }
  } catch (err) {
    // There was an error at compile time. Call Debugger.
    numRetries++;
    if (numRetries > 5) {
      console.error('Retries have failed too many times. Exiting...');
      throw err;
    }
    console.error(`There was an error: ${err.toString()} Debugging...`);

    const rawCommandsRun = convertCommandsToRawOutput(commandsRun);

    const debuggingResult = await getDebuggingCode(rawCommandsRun + err.toString());
    const debuggingCommandList = convertRawOutputToCommandList(debuggingResult);
    let qrCodeUri = await interpretInput(debuggingCommandList, currentDirectory);

    if (qrCodeUri) {
      return qrCodeUri;
    }
    
    let fixedCode = await getGeneratedCode(rawCommandsRun);// note: doesn't have original prompt. Edit model so that it includes it.
    let fixedCommandList = convertRawOutputToCommandList(fixedCode);
    return await interpretInput(fixedCommandList, currentDirectory);
    // This should really pass in the entire log.
  }
  return {} as ExecuteCodeResponse;
}

async function toFileStringArray(input, folderName = "test") {
  let currentDirectory = folderName;
  // input = replaceVariables(input);
  const lines = input.split('\n');
  console.log(lines);

  const foundFiles = [];
  
  let content = '';
  let filepath = '';
  let isNewFile = false;
  let runningLog = '';
  let lastLineRun = '';
  try {
    for (let command of lines) {
      console.log(command);
      lastLineRun = command;
      runningLog+=command;
      if (command.startsWith('new_file: ')) {
        console.log('File found! Reading...');
        content = command +'\n';
        isNewFile = true;
      } else if (isNewFile) {
        if (command.startsWith('end new_file')) {
          isNewFile = false;
          content+= (command + '\n');
          foundFiles.push(content);
          continue;
        }
        console.log(command);
        content += (command + '\n');
      } else {
        console.log('Irrelevant command.');
      }
    }
  } catch (err) {
    // There was an error at compile time. Call Debugger.
    console.error(`There was an error when parsing file list: ${err.toString()}`);
  }
  return foundFiles;
}

export async function getFileCommands(commandList: any[]) {
  const fileCommands = [];
  for (let command of commandList) {
    if (command.type === 'new_file') {
      fileCommands.push(command);
    }
  }
  return fileCommands;
}

export async function getBuildCommands(commandList: any[]) {
  const buildCommands = [];
  for (let command of commandList) {
    if (command.type === 'build_command') {
      buildCommands.push(command);
    }
  }
  return buildCommands;
}

export async function getCdCommands(commandList: any[]) {
  const cdCommands = [];
  for (let command of commandList) {
    if (command.type === 'run_command' && command.command.startsWith('cd ')) {
      cdCommands.push(command);
    }
  }
  return cdCommands;
}


export async function executeCode(input: any[], folderName = 'test') {
  createDirectory(folderName);
  const executionResponse: ExecuteCodeResponse = await interpretInput(input, folderName);
  return executionResponse;
}

export async function getGeneratedCode(userChatRequest: string, chatHistory: any[] = []): Promise<string> {
  const prePrompt = readFileSync("src/prompts/frontend-prompt.txt", "utf-8");
  console.log(userChatRequest);
  const systemContext = {
    "role": "system",
    "content": prePrompt,
  }
  const userRequest = {
    "role": "user",
    "content": userChatRequest + ". Make sure to use React Native Expo.",
  }
  const existingMessages = []
  existingMessages.push(systemContext);
  existingMessages.push(...chatHistory);
  existingMessages.push(userRequest);

  const response = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: existingMessages,
    temperature: 0.5,
    max_tokens: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response.data.choices[0]);
  return response.data.choices[0].message.content;
}

export async function getDebuggingCode(errLog: string) {
  const prePrompt = "You are a bot that takes in a log of a build error and generates the directions in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: How can I fix this code?\n\n";
  const request = errLog;
  const response = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: [
      {
        "role": "system",
        "content": prePrompt,
      },
      {
        "role": "user",
        "content": request,
      },
    ],
    temperature: 0.5,
    max_tokens: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response.data.choices[0].message);
  return response.data.choices[0].message.content;
}


export async function getMultiturnCode(prompt: string) {
  const prePrompt = readFileSync("src/prompts/multiturn-prompt.txt", "utf-8");
  const request = prompt;
  const response = await openai.createChatCompletion({
    model: LLM_MODEL,
    messages: [
      {
        "role": "system",
        "content": prePrompt,
      },
      {
        "role": "user",
        "content": request,
      },
    ],
    temperature: 0.5,
    max_tokens: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response.data.choices[0].message);
  return response.data.choices[0].message.content;
}

/**
 * This function takes in a code snippet and returns the stylized code.
 * @param {string} codeSnippet The code snippet to be stylized.
 */
export async function getStylizedCode(codeSnippet: string) {
  const prePrompt = "You are a bot that takes in code file contents (possibly multiple files) and makes it stylized. The changes should have a modern, vibrant feel to it.\n\nDescribe step by step what changes should be made, and then show me the changed files.\n\nIf the stylistic changes require that new packages be installed, display the commands you need to run to install the new package using this format:\n\nrun_command: {install command to be run}\n\nFiles are marked using these demarcations:\n\nnew_file: {filePath}\n{contents of file}\nend new_file\n\nMake sure the end style makes the app easy to use and that it makes elements fill the screen properly.\n\nInput: \n\n";
    const request = codeSnippet;
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prePrompt + request,
        temperature: 0.1,
        max_tokens: MAX_TOKENS,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
}

export function dedupeFileList(oldFileList: FileCommand[], newFileList: FileCommand[]) {
  // replace all the files in the oldFileList with the files in the newFileList if they have the same filePath
  const dedupedFileList = oldFileList.map((oldFile) => {
    const newFile = newFileList.find((newFile) => newFile.filePath === oldFile.filePath);
    if (newFile) {
      return newFile;
    } else {
      return oldFile;
    }
  });

  return dedupedFileList;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

