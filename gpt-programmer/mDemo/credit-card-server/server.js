
const express = require('express');
const app = express();

const cardList = {
  cards: [
    {
      cardName: "American Express Propel Card",
      rewards: {
        RESTAURANTS: {
          points: 1
        },
        GAS: {
          points: 2
        }
      }
    }
  ]
};

app.get('/', (req, res) => {
  const { merchantName, MCC, transactionAmount } = req.query;

  let maxRewardCard = '';

  for (let i = 0; i < cardList.cards.length; i++) {
    const card = cardList.cards[i];
    const rewards = card.rewards[MCC] || { points: 0 };
    const points = rewards.points || 0;
    const reward = points * transactionAmount;

    if (maxRewardCard === '' || reward > maxRewardCard.reward) {
      maxRewardCard = { name: card.cardName, reward };
    }
  }

  res.json({
    merchantName,
    MCC,
    transactionAmount,
    recommendedCard: maxRewardCard.name
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
