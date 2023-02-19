const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { resolve } = require('path');

const { Configuration, OpenAIApi } = require("openai");

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

const runBuildCommand = async (command, folderName) => {
  console.log(`Running Build command: ${command} in folder: ${folderName}`);
  return new Promise((resolve, reject)=> {
    var buildProcess = exec(`cd ${folderName} && ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.error(`stderr: ${stderr}`);
    });
    let output = '';
    buildProcess.stdout.on('data', function(data) {
      console.log(data);
      output+=data.toString();
      if (output.includes('Started Metro Bundler')) {
        // server successfully started. Print.
        resolve(output);
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
  });
};


const createFile = (filepath, content) => {
  console.log(`Creating file: ${filepath}`);
  const baseFilePath = path.dirname(filepath);
  createDirectory(baseFilePath);
  fs.writeFileSync(path.join(filepath), content);
};

const isRunnableCode = (command) => {
  result = true;
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

function getUserInput(str) {
  let lines = str.split('\n');
  let hashmap = {};

  for (let command of lines) {
    if (command.startsWith('request_info:')) {
      let parts = command.split('--');
      let promptInfo = parts[0].slice(13).trim();
      let varName = parts[1].trim();
      let userInput = prompt(promptInfo);
      hashmap[varName] = userInput;
    }
  }

  return hashmap;
}

function replaceVariables(str) {
  let hashmap = getUserInput(str);

  for (let key in hashmap) {
    let value = hashmap[key];
    let pattern = new RegExp("${"+key+"}", 'g');

    if (!value.startsWith('"') && !value.endsWith('"')) {
      value = `"${value}"`;
    }

    str = str.replace(pattern, value);
  }

  return str;
}

/**
 * This function takes in a list of objects and returns a string
 * @param {Array} commandList
 * @returns {string}
 */
function convertCommandsToRawOutput(commandList) {
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
function convertRawOutputToCommandList(inputString) {
  const inputLines = inputString.trim().split('\n');
  const commandList = [];
  let currentFile = {};
  let isNewFile = false;
  let lineData = {};

  for (let command of inputLines) {
    lineData = {};

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

/**
 * This function takes in a list of commands and runs the commands
 */
async function interpretInput(commandList, folderName = "test") {
  let currentDirectory = folderName;

  let content = '';
  let filepath = '';
  let isNewFile = false;
  let runningLog = '';
  let lastLineRun = '';
  try {
    for (let commandObject of commandList) {
      console.log(commandObject);
      // lastLineRun = command;
      // runningLog+=command;
      if (commandObject.type === 'build_command') {
        console.log('Command found! Running...');
        lastLineRun = commandObject.command;
        const command = commandObject.command;
        const buildOutput = await runBuildCommand(command, currentDirectory);
        return filterBuildOutput(buildOutput);
      } 
      else if (commandObject.type === 'run_command') {
        console.log('Command found! Running...');
        lastLineRun = commandObject.command;
        const command = commandObject.command;
        if (command.startsWith('cd ')) {
          currentDirectory = path.resolve(currentDirectory, command.substring(3));
          console.log(`Changed current directory to ${currentDirectory}`);
        }
        else {
          await runCommand(command, currentDirectory);
        }
      } 
      else if (commandObject.type === 'new_file') {
        console.log('File found! Creating...');
        filepath = commandObject.filePath;
        createFile(path.join(currentDirectory, filepath), commandObject.content);
      } 
      else {
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
    // TODO: Fix this to work with raw input again.
    const debuggingResult = await getDebuggingCode(runningLog + err.toString());
    const debuggingCommandList = await processInput(debuggingResult);
    let qrCodeUri = await interpretInput(debuggingCommandList, currentDirectory);
    if (qrCodeUri) {
      return qrCodeUri;
    }
    runningLog = runningLog.substring(0,runningLog.length - lastLineRun.length);
    let debuggingStart = runningLog.length;
    runningLog+=debuggingResult;
    let fixedCode = await getGeneratedCode(runningLog);// note: doesn't have original prompt. Edit model so that it includes it.
    let fixedCommandList = await processInput(fixedCode);
    return await interpretInput(fixedCommandList, currentDirectory);
    // This should really pass in the entire log.
  }
  return null;
}

/**
 * This function takes in a string and returns a list of commands
 * @deprecated
 */
async function interpretInputDep(input, folderName = "test") {
    let currentDirectory = folderName;
    // input = replaceVariables(input);
    const lines = input.split('\n');
    console.log(lines);
    
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
        if (command.startsWith('build_command: ')) {
          console.log('Command found! Running...');
          const command = command.substring(15);
          const buildOutput = await runBuildCommand(command, currentDirectory);
          return filterBuildOutput(buildOutput);
        } else if (command.startsWith('run_command: ')) {
          console.log('Command found! Running...');
          const command = command.substring(13);
          if (command.startsWith('cd ')) {
            currentDirectory = path.resolve(currentDirectory, command.substring(3));
            console.log(`Changed current directory to ${currentDirectory}`);
          } 
          else {
            await runCommand(command, currentDirectory);
          }
        } else if (command.startsWith('new_file: ')) {
          console.log('File found! Creating...');
          filepath = command.substring(10);
          content = '';
          isNewFile = true;
        } else if (isNewFile) {
          if (command.startsWith('end new_file')) {
            isNewFile = false;
            createFile(path.join(currentDirectory, filepath), content);
            continue;
          }
          if (!isRunnableCode(command)) {
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
      numRetries++;
      if (numRetries > 5) {
        console.error('Retries have failed too many times. Exiting...');
        throw err;
      }
      console.error(`There was an error: ${err.toString()} Debugging...`);
      const debuggingResult = await getDebuggingCode(runningLog + err.toString());
      let qrCodeUri = await interpretInput(debuggingResult, currentDirectory);
      if (qrCodeUri) {
        return qrCodeUri;
      }
      runningLog = runningLog.substring(0,runningLog.length - lastLineRun.length);
      let debuggingStart = runningLog.length;
      runningLog+=debuggingResult;
      let fixedCode = await getGeneratedCode(runningLog);// note: doesn't have original prompt. Edit model so that it includes it.

      return await interpretInput(fixedCode, currentDirectory);
      // This should really pass in the entire log.
    }
    return null;
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

async function getFileCommands(commandList) {
  const fileCommands = [];
  for (let command of commandList) {
    if (command.type === 'new_file') {
      fileCommands.push(command);
    }
  }
  return fileCommands;
}

async function executeCode(input, folderName = 'test') {
  createDirectory(folderName);
  const qrCodeUri = interpretInput(input, folderName);
  return qrCodeUri;
}

async function getGeneratedCode(prompt) {
  const prePrompt = "You are a bot that takes in a prompt about an app as input and generates the directions on how to make the app in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a build command needs to be run, show me the command in this format:\n\nbuild_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif additional information is required, display that information to the user in this format:\n\nrequest_info: {Prompt for Info}-- {name of variable within code}\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: Show me how I can create an app using react native that tells the weather of new york.\n\nHere's a step-by-step process to create a weather app using React Native:\n\nCreate a new React Native project:\nrun_command: expo init WeatherApp --template blank\n\nChange into the project directory:\nrun_command: cd WeatherApp\n\nInstall dependencies:\nrun_command: npm install axios\n\nRequest an API key from a weather API provider such as OpenWeatherMap:\nrequest_info: OpenWeatherMap API key-- OPENWEATHERMAP_API_KEY\n\nCreate a file weather.js in root of the project:\nnew_file: weather.js\n\n```\nimport axios from 'axios';\n\nconst fetchWeather = async (city) => {\n  const res = await axios.get(\n    `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`\n  );\n\n  return res.data;\n};\n\nexport default fetchWeather;\nend new_file\n\nCreate a file App.js in the root of the project:\nnew_file: App.js\n\n```\nimport React, { useState, useEffect } from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\nimport fetchWeather from './weather';\n\nconst App = () => {\n  const [weather, setWeather] = useState({});\n\n  useEffect(() => {\n    fetchWeather('New York').then((data) => setWeather(data));\n  }, []);\n\n  return (\n    <View style={styles.container}>\n      <Text>{JSON.stringify(weather)}</Text>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    alignItems: 'center',\n    justifyContent: 'center',\n  },\n});\n\nexport default App;\n```\nend new_file\n\nStart the app:\nbuild_command: expo start\n\nInput: Create a Calculator App.\n\nHere's a step-by-step process to create a Calculator app using React Native Expo:\n\nCreate a new React Native project:\nrun_command: expo init CalculatorApp --template blank\n\nChange into the project directory:\nrun_command: cd CalculatorApp\n\nCreate a file App.js in the root of the project:\nnew_file: App.js\n\n```\nimport React, { useState } from 'react';\nimport { View, Text, StyleSheet, TextInput, Button } from 'react-native';\n\nconst App = () => {\n  const [input, setInput] = useState('');\n\n  const handleInput = (text) => {\n    setInput(text);\n  };\n\n  const handleButtonPress = (text) => {\n    setInput(input + text);\n  };\n\n  const handleEvaluate = () => {\n    const expression = input;\n    setInput(String(eval(expression)));\n  };\n\n  const handleClear = () => {\n    setInput('');\n  };\n\n  return (\n    <View style={styles.container}>\n      <TextInput\n        style={styles.textInput}\n        placeholder=\"Enter an expression\"\n        value={input}\n        onChangeText={handleInput}\n      />\n      <View style={styles.buttonsContainer}>\n        <Button title=\"7\" onPress={() => handleButtonPress('7')} />\n        <Button title=\"8\" onPress={() => handleButtonPress('8')} />\n        <Button title=\"9\" onPress={() => handleButtonPress('9')} />\n        <Button title=\"+\" onPress={() => handleButtonPress('+')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"4\" onPress={() => handleButtonPress('4')} />\n        <Button title=\"5\" onPress={() => handleButtonPress('5')} />\n        <Button title=\"6\" onPress={() => handleButtonPress('6')} />\n        <Button title=\"-\" onPress={() => handleButtonPress('-')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"1\" onPress={() => handleButtonPress('1')} />\n        <Button title=\"2\" onPress={() => handleButtonPress('2')} />\n        <Button title=\"3\" onPress={() => handleButtonPress('3')} />\n        <Button title=\"*\" onPress={() => handleButtonPress('*')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"Clear\" onPress={handleClear} />\n        <Button title=\"0\" onPress={() => handleButtonPress('0')} />\n        <Button title=\"=\" onPress={handleEvaluate} />\n        <Button title=\"/\" onPress={() => handleButtonPress('/')} />\n      </View>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    paddingTop: 40,\n    alignItems: 'center',\n  },\n  textInput: {\n    width: '80%',\n    padding: 10,\n    margin: 10,\n    borderWidth: 1,\n    borderColor: '#ccc',\n  },\n  buttonsContainer: {\n    flexDirection: 'row',\n    justifyContent: 'space-around',\n    width: '80%',\n  },\n});\n\nexport default App;\n```\nend new_file\n\nStart the app:\nbuild_command: expo start\n\nInput: \n\n";
  const request = prompt;
  console.log(request);
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
  return response.data.choices[0].text;
}

async function getDebuggingCode(errLog) {
  await sleep(8000);
  const prePrompt = "You are a bot that takes in a log of a build error and generates the directions in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: How can I fix this code?\n\n";
    const request = errLog;
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prePrompt + request,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
}

/**
 * This function takes in a code snippet and returns the stylized code.
 * @param {string} codeSnippet The code snippet to be stylized.
 */
async function getStylizedCode(codeSnippet) {
  const prePrompt = "You are a bot that takes in code file contents (possibly multiple files) and makes it stylized. The changes should have a modern, vibrant feel to it.\n\nDescribe step by step what changes should be made, and then show me the changed files.\n\nIf the stylistic changes require that new packages be installed, display the commands you need to run to install the new package using this format:\n\nrun_command: {install command to be run}\n\nFiles are marked using these demarcations:\n\nnew_file: {filePath}\n{contents of file}\nend new_file\n\nMake sure the end style makes the app easy to use and that it makes elements fill the screen properly.\n\nInput: \n\n";
    const request = codeSnippet;
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prePrompt + request,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readAndExecuteFile(fileName, folderName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(executeCode(data, folderName));
      }
    });
  });
}

module.exports = { executeCode, getGeneratedCode, convertRawOutputToCommandList, getStylizedCode, convertCommandsToRawOutput, getFileCommands }