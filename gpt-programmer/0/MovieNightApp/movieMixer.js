import axios from 'axios';

const getCommonGenres = (movie1, movie2) => {
  const commonGenres = movie1.genre_ids.filter((genre) => movie2.genre_ids.includes(genre));
  return commonGenres;
};

const fetchMovieByGenres = async (genres, apiKey) => {
  const res = await axios.get(
    `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genres.join(',')}`
  );
  return res.data.results[0];
};

const fetchMovie = async (title, apiKey) => {
  const res = await axios.get(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`
  );
  return res.data.results[0];
};

const generateMovie = async (title1, title2, apiKey) => {
  const movie1 = await fetchMovie(title1, apiKey);
  const movie2 = await fetchMovie(title2, apiKey);
  const commonGenres = getCommonGenres(movie1, movie2);
  const suggestedMovie = await fetchMovieByGenres(commonGenres, apiKey);
  return suggestedMovie;
};

export default generateMovie;
