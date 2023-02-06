import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTextInput = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await axios.post('/generate-code', { prompt:text });
    await axios.post('/execute-code', { code: res.data });
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <input
        style={styles.textInput}
        placeholder="Enter a text prompt"
        value={text}
        onChange={handleTextInput}
      />
      <button style={styles.button} onClick={handleSubmit}>Submit</button>
      {loading && <p>Loading...</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    width: '80%',
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    padding: 10,
    margin: 10,
    backgroundColor: '#ccc',
    border: 'none',
    cursor: 'pointer',
  },
};

export default App;
