import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import { Configuration, OpenAIApi } from "openai";
import { 
  getGeneratedCode, 
  executeCode, 
  convertRawOutputToCommandList, 
  convertCommandsToRawOutput, 
  getFileCommands, 
  getStylizedCode,
  addVariablesToCode,
  getInformationRequest,
  getMultiturnCode,
  getCdCommands,
  dedupeFileList,
  getBuildCommands
 } from './CodeRunner';
import cors from 'cors';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import { ExecuteCodeRequest } from './models/ExecuteCodeRequest';
import { ExecuteCodeResponse } from './models/ExecuteCodeResponse';
dotenv.config({path: '.env'});
import fs from 'fs';
import https from 'https';
import treeKill from 'tree-kill';

// App Setup

export const myCache = new NodeCache();
myCache.set("generatedCodeFolder", 0);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.json());
app.use(cors());

const options = {
  key: fs.readFileSync("server.key", "utf8"),
  cert: fs.readFileSync("server.cert", "utf8"),
};

app.get('/generate-code', async (req, res) => {
  const request = req.query as ExecuteCodeRequest;
  console.log("Request received: ", req.query);

  try {
    if (!request.generatedCodeFolder) {
      const generatedCodeFolder: number = myCache.get("generatedCodeFolder");
      myCache.set("generatedCodeFolder", generatedCodeFolder + 1);
      request.generatedCodeFolder = generatedCodeFolder.toString();
    }
    
    var generatedCode: string;
    if (request.requestedInformation) {
      console.log("Request has requested information. Adding to code.");
      generatedCode = addVariablesToCode(request.code, request.requestedInformation);
    } else {
      console.log("Generating code.");
      generatedCode = await getGeneratedCode(request.prompt);
    }
    console.log("Generated code: ", generatedCode);
    const requestedInformation: any = getInformationRequest(generatedCode);
  
    if (Object.keys(requestedInformation).length > 0) {
      console.log("Request needs additional information. Returning.");
      res.send({
        response: {
          code: generatedCode,
          requestedInformation: requestedInformation,
          generatedCodeFolder: request.generatedCodeFolder,
          isFinished: false,
        }
      });
      return;
    }
  
    let commandList = convertRawOutputToCommandList(generatedCode);
    console.log("Command List: ", commandList);
  
    if (request.applyExtraStyling === "true") {
      console.log("Request wants extra styling.");
      const fileCommands = await getFileCommands(commandList);
      const rawFileCommands = convertCommandsToRawOutput(fileCommands);
      const stylizedCode = await getStylizedCode(rawFileCommands);
      let stylizedCommandList = convertRawOutputToCommandList(stylizedCode);
      commandList = commandList
        .slice(0, commandList.length - 1)
        .concat(stylizedCommandList)
        .concat(commandList[commandList.length - 1]);
  
      console.log("commandList after styling: ", commandList);
    }
  
    const response: ExecuteCodeResponse = await executeCode(commandList, request.generatedCodeFolder);
    response.code = convertCommandsToRawOutput(commandList);
    response.generatedCodeFolder = request.generatedCodeFolder;
    res.send({
      response
    });
  } catch (error) {
    console.log("Error: ", error);
    res.send({
      response: {
        error: error.message,
      }
    });
  }
});

/**
 * This endpoint is used to handle the case where the user
 * wants to edit the code that was generated.
 */
app.get('/edit-code', async (req, res) => {
  try {
    const request = req.query as ExecuteCodeRequest;
    console.log("Request received to edit code: ", req.query);

    // if there is a pid in request, then kill it.
    if (request.pid) {
      console.log("Request has a pid. Killing process.");
      treeKill(parseInt(request.pid), 'SIGTERM');
    }
    if (!request.generatedCodeFolder) {
      console.log("No generated code folder. Returning.");
      return;
    }

    const originalCommandList = convertRawOutputToCommandList(request.code);
    const originalFilesList = await getFileCommands(originalCommandList);
    const originalFiles = convertCommandsToRawOutput(originalFilesList);

    const editedCode = await getMultiturnCode(request.prompt + "\n\n" + originalFiles);
    console.log("Edited Code: ", editedCode);
    const cdCommandsList = await getCdCommands(originalCommandList);
    const cdCommands = convertCommandsToRawOutput(cdCommandsList);
    const editedCodeWithCdCommands = cdCommands + editedCode;
    let commandList = convertRawOutputToCommandList(editedCodeWithCdCommands);
    commandList = commandList.concat(await getBuildCommands(originalCommandList));

    const response: ExecuteCodeResponse = await executeCode(commandList, request.generatedCodeFolder);
    console.log("Code finished executing. Response: ", response);
    // now, combine the new edited code with the old edited files and return that.
    const editedFilesList = await getFileCommands(commandList);
    const finalFilesList = dedupeFileList(originalCommandList, editedFilesList);
    const finalFiles = convertCommandsToRawOutput(finalFilesList);
    response.code = finalFiles;
    response.generatedCodeFolder = request.generatedCodeFolder;
    res.send({
      response
    });
  } catch (e) {
    console.log("Error editing code: ", e);
  }
});

/**
 * This endpoint is used to handle the case where the user 
 * needs to provide additional information.
 */
app.get('generate-code-multiturn', async (req, res) => {
  const request = req.query as ExecuteCodeRequest;
  console.log("Request received: ", req.query);
  
  const filteredCode = addVariablesToCode(request.code, request.requestedInformation);

  let commandList = convertRawOutputToCommandList(filteredCode);
  console.log(typeof request.applyExtraStyling);

  if (req.query.applyExtraStyling === "true") {
    console.log("Request wants extra styling.");
    const fileCommands = await getFileCommands(commandList);
    const rawFileCommands = convertCommandsToRawOutput(fileCommands);
    const stylizedCode = await getStylizedCode(rawFileCommands);
    let stylizedCommandList = convertRawOutputToCommandList(stylizedCode);
    commandList = commandList
      .slice(0, commandList.length - 1)
      .concat(stylizedCommandList)
      .concat(commandList[commandList.length - 1]);

    console.log("commandList after styling: ", commandList);
  }

  const response: ExecuteCodeResponse = await executeCode(commandList);
  response.code = convertCommandsToRawOutput(commandList);
  response.generatedCodeFolder = request.generatedCodeFolder;
  res.send({
    data: response
  });
});

// @deprecated
app.get('/execute-code', async (req, res) => {
    const requestCode = req.body.code ? req.body.code : req.query.code;
    console.log(requestCode);
    const response = await executeCode(requestCode);
    console.log('Nice. ' + response);
    console.log('Results have been finished. Returning');
    // print the QR code:
    res.send({
        data: response
    });
});

app.get('/debug-code', async (req, res) => {

    const prePrompt = "You are a bot that takes in a log of a build error and generates the directions in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif additional information is required, display that information to the user in this format:\n\nrequest_info: {Prompt for Info}--{name of variable within code}\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: How can I fix this code?\n\nHere's a step-by-step process to create a Rock-Paper-Scissors game website using React and Node.js:\nIrrelevant line.\n\nIrrelevant line.\nCreate a new Node.js project:\nIrrelevant line.\nrun_command: npx create-react-app RockPaperScissorsGame\nCommand found! Running...\nRunning command: npx create-react-app RockPaperScissorsGame in folder: RPSTwo\nError: Error: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\nnode:internal/errors:863\n  const err = new Error(message);\n              ^\n\nError: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\n    at ChildProcess.exithandler (node:child_process:412:12)\n    at ChildProcess.emit (node:events:513:28)\n    at maybeClose (node:internal/child_process:1091:16)\n    at Socket.<anonymous> (node:internal/child_process:449:11)\n    at Socket.emit (node:events:513:28)\n    at Pipe.<anonymous> (node:net:313:12) {\n  code: 1,\n  killed: false,\n  signal: null,\n  cmd: 'cd RPSTwo && npx create-react-app RockPaperScissorsGame'\n}\n\nOutput: \nrequest_info: Please provide a new name for the project that adheres to npm naming restrictions (no capital letters)--new_project_name\nrun_command: npx create-react-app {{new_project_name}}\n\nInput: ";
    // const prePrompt = "You are a bot that takes in a log of a build error and generates the directions in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif additional information is required, display that information to the user in this format:\n\nrequest_info: {Prompt for Info}-- {name of variable within code}\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: How can I fix this code?\n\nHere's a step-by-step process to create a Rock-Paper-Scissors game website using React and Node.js:\nIrrelevant line.\n\nIrrelevant line.\nCreate a new Node.js project:\nIrrelevant line.\nrun_command: npx create-react-app RockPaperScissorsGame\nCommand found! Running...\nRunning command: npx create-react-app RockPaperScissorsGame in folder: RPSTwo\nError: Error: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\nnode:internal/errors:863\n  const err = new Error(message);\n              ^\n\nError: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\n    at ChildProcess.exithandler (node:child_process:412:12)\n    at ChildProcess.emit (node:events:513:28)\n    at maybeClose (node:internal/child_process:1091:16)\n    at Socket.<anonymous> (node:internal/child_process:449:11)\n    at Socket.emit (node:events:513:28)\n    at Pipe.<anonymous> (node:net:313:12) {\n  code: 1,\n  killed: false,\n  signal: null,\n  cmd: 'cd RPSTwo && npx create-react-app RockPaperScissorsGame'\n}\n\nOutput: \nHere's how you can fix this error:\nrun_command: npx create-react-app rockpaperscissorsgame\n\nInput: ";
    const request = req.body.prompt;
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prePrompt + request,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
    console.log(response.data.choices[0]);
    res.send({
        data: response.data.choices[0]
    });
});

const port = process.env.PORT || 4242;

if (process.env.ENV_STAGE === 'development' || process.env.ENV_STAGE === 'test') {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
} else {
  https.createServer(options, app)
  .listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

