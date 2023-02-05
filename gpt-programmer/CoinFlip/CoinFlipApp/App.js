
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const App = () => {
  const [coinSide, setCoinSide] = useState('heads');

  const flipCoin = () => {
    const randomSide = Math.random();

    if (randomSide < 0.5) {
      setCoinSide('heads');
    } else {
      setCoinSide('tails');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.resultText}>{coinSide}</Text>
      <TouchableOpacity style={styles.button} onPress={flipCoin}>
        <Text>Flip Coin</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 5,
  },
});

export default App;
