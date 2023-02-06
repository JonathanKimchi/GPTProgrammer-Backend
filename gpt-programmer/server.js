const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");
const cors = require('cors');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.json());
app.use(cors());

app.get('/generate-code', async (req, res) => {

  const prePrompt = "You are a bot that takes in a prompt about an app as input and generates the directions on how to make the app in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif additional information is required, display that information to the user in this format:\n\nrequest_info: {Prompt for Info}-- {name of variable within code}\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: Show me how I can create an app using react native that tells the weather of new york.\n\nHere's a step-by-step process to create a weather app using React Native:\n\nCreate a new React Native project:\nrun_command: expo init WeatherApp --template blank\n\nChange into the project directory:\nrun_command: cd WeatherApp\n\nInstall dependencies:\nrun_command: npm install axios\n\nRequest an API key from a weather API provider such as OpenWeatherMap:\nrequest_info: OpenWeatherMap API key-- OPENWEATHERMAP_API_KEY\n\nCreate a file weather.js in root of the project:\nnew_file: weather.js\n\n```\nimport axios from 'axios';\n\nconst fetchWeather = async (city) => {\n  const res = await axios.get(\n    `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`\n  );\n\n  return res.data;\n};\n\nexport default fetchWeather;\nend new_file\n\nCreate a file App.js in the root of the project:\nnew_file: App.js\n\n```\nimport React, { useState, useEffect } from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\nimport fetchWeather from './weather';\n\nconst App = () => {\n  const [weather, setWeather] = useState({});\n\n  useEffect(() => {\n    fetchWeather('New York').then((data) => setWeather(data));\n  }, []);\n\n  return (\n    <View style={styles.container}>\n      <Text>{JSON.stringify(weather)}</Text>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    alignItems: 'center',\n    justifyContent: 'center',\n  },\n});\n\nexport default App;\n```\nend new_file\n\nStart the app:\nrun_command: expo start\n\nInput: Create a Calculator App.\n\nHere's a step-by-step process to create a Calculator app using React Native Expo:\n\nCreate a new React Native project:\nrun_command: expo init CalculatorApp --template blank\n\nChange into the project directory:\nrun_command: cd CalculatorApp\n\nCreate a file App.js in the root of the project:\nnew_file: App.js\n\n```\nimport React, { useState } from 'react';\nimport { View, Text, StyleSheet, TextInput, Button } from 'react-native';\n\nconst App = () => {\n  const [input, setInput] = useState('');\n\n  const handleInput = (text) => {\n    setInput(text);\n  };\n\n  const handleButtonPress = (text) => {\n    setInput(input + text);\n  };\n\n  const handleEvaluate = () => {\n    const expression = input;\n    setInput(String(eval(expression)));\n  };\n\n  const handleClear = () => {\n    setInput('');\n  };\n\n  return (\n    <View style={styles.container}>\n      <TextInput\n        style={styles.textInput}\n        placeholder=\"Enter an expression\"\n        value={input}\n        onChangeText={handleInput}\n      />\n      <View style={styles.buttonsContainer}>\n        <Button title=\"7\" onPress={() => handleButtonPress('7')} />\n        <Button title=\"8\" onPress={() => handleButtonPress('8')} />\n        <Button title=\"9\" onPress={() => handleButtonPress('9')} />\n        <Button title=\"+\" onPress={() => handleButtonPress('+')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"4\" onPress={() => handleButtonPress('4')} />\n        <Button title=\"5\" onPress={() => handleButtonPress('5')} />\n        <Button title=\"6\" onPress={() => handleButtonPress('6')} />\n        <Button title=\"-\" onPress={() => handleButtonPress('-')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"1\" onPress={() => handleButtonPress('1')} />\n        <Button title=\"2\" onPress={() => handleButtonPress('2')} />\n        <Button title=\"3\" onPress={() => handleButtonPress('3')} />\n        <Button title=\"*\" onPress={() => handleButtonPress('*')} />\n      </View>\n      <View style={styles.buttonsContainer}>\n        <Button title=\"Clear\" onPress={handleClear} />\n        <Button title=\"0\" onPress={() => handleButtonPress('0')} />\n        <Button title=\"=\" onPress={handleEvaluate} />\n        <Button title=\"/\" onPress={() => handleButtonPress('/')} />\n      </View>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    paddingTop: 40,\n    alignItems: 'center',\n  },\n  textInput: {\n    width: '80%',\n    padding: 10,\n    margin: 10,\n    borderWidth: 1,\n    borderColor: '#ccc',\n  },\n  buttonsContainer: {\n    flexDirection: 'row',\n    justifyContent: 'space-around',\n    width: '80%',\n  },\n});\n\nexport default App;\n```\nend new_file\n\nStart the app:\nrun_command: expo start\n\nInput: ";
  const request = req.body.prompt;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prePrompt + request,
    temperature: 0.7,
    max_tokens: 200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response.data.choices[0]);
  res.send({
    data: response.data.choices[0]
  });
});

app.get('execute-code', async (req, res) => {
    
});

app.get('/debug-code', async (req, res) => {

    const prePrompt = "You are a bot that takes in a log of a build error and generates the directions in a format that's easily parseable.\n\nif files need to be created, show me the files in this format:\n\nnew_file: {path of file}\n{content of file}\nend new_file\n\nif a command needs to be run, show me the command in this format:\n\nrun_command: {command to be run}\n\nif a command needs to be run, always use a non-interactive command.\n\nif additional information is required, display that information to the user in this format:\n\nrequest_info: {Prompt for Info}-- {name of variable within code}\n\nif multiple user-created files are required, you should create all the files required.\n\nInput: How can I fix this code?\n\nHere's a step-by-step process to create a Rock-Paper-Scissors game website using React and Node.js:\nIrrelevant line.\n\nIrrelevant line.\nCreate a new Node.js project:\nIrrelevant line.\nrun_command: npx create-react-app RockPaperScissorsGame\nCommand found! Running...\nRunning command: npx create-react-app RockPaperScissorsGame in folder: RPSTwo\nError: Error: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\nnode:internal/errors:863\n  const err = new Error(message);\n              ^\n\nError: Command failed: cd RPSTwo && npx create-react-app RockPaperScissorsGame\nCannot create a project named \"RockPaperScissorsGame\" because of npm naming restrictions:\n\n  * name can no longer contain capital letters\n\nPlease choose a different project name.\n\n    at ChildProcess.exithandler (node:child_process:412:12)\n    at ChildProcess.emit (node:events:513:28)\n    at maybeClose (node:internal/child_process:1091:16)\n    at Socket.<anonymous> (node:internal/child_process:449:11)\n    at Socket.emit (node:events:513:28)\n    at Pipe.<anonymous> (node:net:313:12) {\n  code: 1,\n  killed: false,\n  signal: null,\n  cmd: 'cd RPSTwo && npx create-react-app RockPaperScissorsGame'\n}\n\nOutput: \nrequest_info: Please provide a new name for the project that adheres to npm naming restrictions (no capital letters) -- new_project_name\nrun_command: npx create-react-app {{new_project_name}}\n\nInput: ";
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
