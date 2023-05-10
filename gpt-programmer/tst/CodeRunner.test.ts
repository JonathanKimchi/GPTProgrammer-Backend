const { exec } = require('child_process');
const axios = require('axios');
const myCache = require('../dist/server.js').myCache;
const { interpretInput, getInformationRequest, convertCommandsToRawOutput, convertRawOutputToCommandList } = require('../dist/CodeRunner.js');

// getInformationRequest
describe('getInformationRequest', () => {
  it('should return an object with the requested information', () => {
    const generatedCode = 'request_info: promptInfo -- varName';
    const expectedResult = {promptInfo: 'varName'};
    expect(getInformationRequest(generatedCode)).toEqual(expectedResult);
  });
});

// convertCommandsToRawOutput
describe('convertCommandsToRawOutput', () => {
  it('should return a string with the commands', () => {
    const commandList = [
      {type: 'build_command', command: 'build command 1'},
      {type: 'run_command', command: 'run command 1'},
      {type: 'new_file', filePath: 'file1.txt', content: 'content of file1'}
    ];
    const expectedResult = 'build_command: build command 1\nrun_command: run command 1\nnew_file: file1.txt\ncontent of file1\nend new_file\n';
    expect(convertCommandsToRawOutput(commandList)).toBe(expectedResult);
  });
});

// convertRawOutputToCommandList
describe('convertRawOutputToCommandList', () => {
  it('should return a list of commands', () => {
    const inputString = 'build_command: build command 1\nrun_command: run command 1\nnew_file: file1.txt\ncontent of file1\nend new_file\n';
    const expectedResult = [
      {type: 'build_command', command: 'build command 1'},
      {type: 'run_command', command: 'run command 1'},
      {type: 'new_file', filePath: 'file1.txt', content: 'content of file1\n'}
    ];
    expect(convertRawOutputToCommandList(inputString)).toEqual(expectedResult);
  });
});