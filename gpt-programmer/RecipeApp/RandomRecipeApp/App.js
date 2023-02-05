
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import recipes from './src/recipes.json';

const App = () => {
  const [recipe, setRecipe] = useState({});

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 2);
    setRecipe(recipes[randomIndex]);
  }, []);

  const handleButtonPress = () => {
    const randomIndex = Math.floor(Math.random() * 2);
    setRecipe(recipes[randomIndex]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{recipe.name}</Text>
      {recipe.steps &&
        recipe.steps.map((step, index) => (
          <Text key={index} style={styles.step}>
            {step}
          </Text>
        ))}
      <Button title="Generate Random Recipe" onPress={handleButtonPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  step: {
    fontSize: 15,
    marginTop: 5,
    marginBottom: 5,
  },
});

export default App;
