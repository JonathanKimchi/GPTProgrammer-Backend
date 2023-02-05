
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';

const App = () => {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('movies.json')
      .then((response) => response.json())
      .then((data) => setMovies(data))
      .catch((error) => console.log(error));
  }, []);

  const handleQuery = (text) => {
    setQuery(text);
  };

  const filteredMovies = movies.filter((movie) => {
    const title = movie.title.toLowerCase();
    const queryLowerCase = query.toLowerCase();
    return title.includes(queryLowerCase);
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Search for a movie"
        value={query}
        onChangeText={handleQuery}
      />
      <FlatList
        data={filteredMovies}
        renderItem={({ item }) => (
          <View style={styles.movieContainer}>
            <Text style={styles.movieTitle}>{item.title}</Text>
            <Text style={styles.movieDetails}>{item.genre}</Text>
            <Text style={styles.movieDetails}>{item.year}</Text>
          </View>
        )}
        keyExtractor={(item) => item.title}
      />
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
    width: '90%',
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  movieContainer: {
    flex: 1,
    width: '90%',
    padding: 10,
    margin: 10,
    backgroundColor: '#ccc',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  movieDetails: {
    fontSize: 15,
    color: '#666',
  },
});

export default App;
