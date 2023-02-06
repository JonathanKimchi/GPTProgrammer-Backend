const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { resolve } = require('path');

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
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
    let output = '';
    buildProcess.on('data', function(data) {
      console.log(data);
      output+=data.toString();
      // if this is an error log, pass error and relevant information into a debugging endpoint. 

    });
  });
};

const createFile = (filepath, content) => {
  console.log(`Creating file: ${filepath}`);
  const baseFilePath = path.dirname(filepath);
  createDirectory(baseFilePath);
  fs.writeFileSync(path.join(filepath), content);
};

const isRunnableCode = (line) => {
  result = true;
  if (line === "```") {
    result = false;
  }
  return result;
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

const folderName = process.argv[2];
const inputFile = process.argv[3];

createDirectory(folderName);

function interpretInput(input) {

}

fs.readFile(inputFile, 'utf-8', async (err, data) => {
  if (err) throw err;

  let currentDirectory = folderName;
  
  const lines = data.split('\n');
  let content = '';
  let filepath = '';
  let isNewFile = false;
  try {
    for (let line of lines) {
      console.log(line);
      if (line.startsWith('run_command: ')) {
        console.log('Command found! Running...');
        const command = line.substring(13);
        if (command.startsWith('cd ')) {
          currentDirectory = path.resolve(currentDirectory, command.substring(3));
          console.log(`Changed current directory to ${currentDirectory}`);
        } 
        else {
          await runCommand(command, currentDirectory);
        }
      } else if (line.startsWith('new_file: ')) {
        console.log('File found! Creating...');
        filepath = line.substring(10);
        content = '';
        isNewFile = true;
      } else if (isNewFile) {
        if (line.startsWith('end new_file')) {
          isNewFile = false;
          createFile(path.join(currentDirectory, filepath), content);
          continue;
        }
        if (!isRunnableCode(line)) {
          continue;
        }
        console.log(line);
        content += (line + '\n');
      } else {
        console.log('Irrelevant line.');
      }
    }
  } catch (err) {

  }
});

async function interpretInput(input) {
    let currentDirectory = folderName;
    
    const lines = input.split('\n');
    let content = '';
    let filepath = '';
    let isNewFile = false;
    let runningLog = '';
    try {
      for (let line of lines) {
        console.log(line);
        runningLog+=line;
        if (line.startsWith('run_command: ')) {
          console.log('Command found! Running...');
          const command = line.substring(13);
          if (command.startsWith('cd ')) {
            currentDirectory = path.resolve(currentDirectory, command.substring(3));
            console.log(`Changed current directory to ${currentDirectory}`);
          } 
          else {
            await runCommand(command, currentDirectory);
          }
        } else if (line.startsWith('new_file: ')) {
          console.log('File found! Creating...');
          filepath = line.substring(10);
          content = '';
          isNewFile = true;
        } else if (isNewFile) {
          if (line.startsWith('end new_file')) {
            isNewFile = false;
            createFile(path.join(currentDirectory, filepath), content);
            continue;
          }
          if (!isRunnableCode(line)) {
            continue;
          }
          console.log(line);
          content += (line + '\n');
        } else {
          console.log('Irrelevant line.');
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
      // const debuggingResult = await getDebuggingResult(runningLog + err.toString());
      // createFile('debugfile.txt', debuggingResult);
      // interpretInput('debugfile.txt');
    }
}