
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const App = () => {
  const [result, setResult] = useState('');

  const handleFlip = () => {
    const randomNum = Math.floor(Math.random() * 2);

    if (randomNum === 0) {
      setResult('Heads');
    } else {
      setResult('Tails');
    }
  };

  return (
    <View style={styles.container}>
      <Text>{result}</Text>
      <Button title="Flip the coin" onPress={handleFlip} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
