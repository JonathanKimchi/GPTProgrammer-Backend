import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import fetchWeather from './weather';

const App = () => {
  const [weather, setWeather] = useState({});

  useEffect(() => {
    fetchWeather('New York').then((data) => setWeather(data));
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://source.unsplash.com/featured/?city,newyork' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Weather in New York</Text>
        {weather.main && (
          <View>
            <Text style={styles.temperature}>{Math.round(weather.main.temp)}°F</Text>
            <Text style={styles.weatherDescription}>{weather.weather[0].description}</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  weatherDescription: {
    fontSize: 24,
    fontWeight: '500',
    color: 'white',
  },
});

export default App;
