
import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://localhost:8080';

const App = () => {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [move, setMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on('update users', (users) => setUsers(users));
    socket.on('start game', (opponent) => {
      setOpponent(opponent);
      setGameStarted(true);
    });
    socket.on('receive move', (move) => {
      setOpponentMove(move.move);
      const result =
        (move.move === 'rock' && move.yourMove === 'scissors') ||
        (move.move === 'scissors' && move.yourMove === 'paper') ||
        (move.move === 'paper' && move.yourMove === 'rock')
          ? 'lose'
          : move.move === move.yourMove
          ? 'draw'
          : 'win';
      setResult(result);
    });
  }, []);

  const handleUsername = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const socket = socketIOClient(ENDPOINT);
    socket.emit('add user', username);
  };

  const handleStartGame = (id) => {
    const socket = socketIOClient(ENDPOINT);
    socket.emit('start game', id);
  };

  const handleMove = (move) => {
    setMove(move);
    const socket = socketIOClient(ENDPOINT);
    socket.emit('send move', {
      opponentId: opponent.opponentId,
      move,
      yourMove: move,
    });
  };

  const renderLobby = () => (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={handleUsername}
        />
        <input type="submit" value="Submit" />
      </form>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name}
            <button onClick={() => handleStartGame(user.id)}>
              Start Game
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderGame = () => (
    <div>
      <h2>You are playing against {opponent.opponentName}</h2>
      <div>
        {['rock', 'paper', 'scissors'].map((move) => (
          <button key={move} onClick={() => handleMove(move)}>
            {move}
          </button>
        ))}
      </div>
      <p>
        You chose {move}. Opponent chose {opponentMove}. You {result}.
      </p>
    </div>
  );

  return (
    <div>
      {gameStarted ? renderGame() : renderLobby()}
    </div>
  );
};

export default App;
