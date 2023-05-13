import axios from 'axios';

const fetchMovies = async () => {
  const res = await axios.get(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=e2a9ad9b03721fc17f377d78c152c9a2&language=en-US&page=1`
  );
  
  return res.data.results;
};

export default fetchMovies;
