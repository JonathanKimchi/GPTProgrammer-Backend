
const express = require('express');

const app = express();

const quotes = [
  "Our greatest glory is not in never failing, but in rising up every time we fail.",
  "The secret of getting ahead is getting started.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "You miss 100% of the shots you don’t take.",
  "The only way to do great work is to love what you do.",
  "Life is 10% what happens to us and 90% how we react to it.",
  "The best way to predict the future is to create it.",
  "You can’t use up creativity. The more you use, the more you have.",
  "The only limit to our realization of tomorrow will be our doubts of today.",
  "Impossible is just an opinion.",
];

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

app.get('/motivational-quote', (req, res) => {
  res.send(getRandomQuote());
});

app.listen(3000, () => console.log('Server running on port 3000'));
