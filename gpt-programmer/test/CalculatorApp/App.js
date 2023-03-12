
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';

const App = () => {
  const [input, setInput] = useState('');

  const handleInput = (text) => {
    setInput(text);
  };

  const handleButtonPress = (text) => {
    setInput(input + text);
  };

  const handleEvaluate = () => {
    const expression = input;
    setInput(String(eval(expression)));
  };

  const handleClear = () => {
    setInput('');
  };

  const handleSquareRoot = () => {
    const expression = input;
    setInput(String(Math.sqrt(expression)));
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Enter an expression"
        value={input}
        onChangeText={handleInput}
      />
      <View style={styles.buttonsContainer}>
        <Button title="7" onPress={() => handleButtonPress('7')} />
        <Button title="8" onPress={() => handleButtonPress('8')} />
        <Button title="9" onPress={() => handleButtonPress('9')} />
        <Button title="+" onPress={() => handleButtonPress('+')} />
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="4" onPress={() => handleButtonPress('4')} />
        <Button title="5" onPress={() => handleButtonPress('5')} />
        <Button title="6" onPress={() => handleButtonPress('6')} />
        <Button title="-" onPress={() => handleButtonPress('-')} />
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="1" onPress={() => handleButtonPress('1')} />
        <Button title="2" onPress={() => handleButtonPress('2')} />
        <Button title="3" onPress={() => handleButtonPress('3')} />
        <Button title="*" onPress={() => handleButtonPress('*')} />
      </View>
      <View style={styles.buttonsContainer}>
        <Button title="Clear" onPress={handleClear} />
        <Button title="0" onPress={() => handleButtonPress('0')} />
        <Button title="=" onPress={handleEvaluate} />
        <Button title="/" onPress={() => handleButtonPress('/')} />
        <Button title="sqrt" onPress={handleSquareRoot} color="red"/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  textInput: {
    width: '80%',
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
});

export default App;

