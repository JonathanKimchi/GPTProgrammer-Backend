import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MovieDetails = ({ route }) => {
  const { movie } = route.params;

  return (
    <View style={styles.container}>
      <Image
        style={styles.poster}
        source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
      />
      <Text style={styles.title}>{movie.title}</Text>
      <Text style={styles.rating}>Rating: {movie.vote_average}</Text>
      <Text style={styles.overview}>{movie.overview}</Text>
      <Text style={styles.link}>Buy tickets here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: 300,
    height: 450,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    fontSize: 18,
  },
  overview: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default MovieDetails;
