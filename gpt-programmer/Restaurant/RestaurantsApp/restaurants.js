
import axios from 'axios';

const fetchRestaurants = async (latitude, longitude) => {
  const res = await axios.get(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=YOUR_API_KEY`
  );

  return res.data.results;
};

export default fetchRestaurants;
