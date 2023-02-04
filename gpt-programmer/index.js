const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const runCommand = (command) => {
  console.log(`Running command: ${command}`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
};

const createFile = (filepath, content) => {
  console.log(`Creating file: ${filepath}`);
  const baseFilePath = removeFileFromPath(filepath);
  createDirectory(baseFilePath);
  fs.writeFileSync(filepath, content);
};

function removeFileFromPath(filePath) {
    return filePath.substring(0, filePath.lastIndexOf("/"));
}

const createDirectory = (filePath) => {
    const dirName = path.dirname(filePath);
    if (fs.existsSync(dirName)) {
      return;
    }
    fs.mkdirSync(dirName, { recursive: true });
};

fs.readFile('input.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  
  const lines = data.split('\n');
  for (const line of lines) {
    console.log(line);
    if (line.startsWith('run_command: ')) {
      runCommand(line.slice(13));
    } else if (line.startsWith('new_file: ')) {
      let filepath = line.slice(10);
      let content = '';
      while (lines.indexOf(line) + 1 < lines.length && !lines[lines.indexOf(line) + 1].startsWith('end new_file')) {
        content += lines[lines.indexOf(line) + 1] + '\n';
        line = lines[lines.indexOf(line) + 1];
      }
      createFile(filepath, content);
    }
  }
});