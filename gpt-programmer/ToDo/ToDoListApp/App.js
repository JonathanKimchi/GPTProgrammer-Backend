
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { Provider as PaperProvider, Appbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const App = () => {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const handleInput = (text) => {
    setInput(text);
  };

  const handleAddTodo = () => {
    const newTodo = {
      id: Math.random().toString(),
      text: input,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInput('');
  };

  const handleDeleteTodo = (id) => {
    const filteredTodos = todos.filter((todo) => todo.id != id);
    setTodos(filteredTodos);
  };

  const handleToggleCompleted = (id) => {
    const updatedTodos = todos.map((todo) => {
      if (todo.id == id) {
        todo.completed = !todo.completed;
      }
      return todo;
    });
    setTodos(updatedTodos);
  };

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="To-Do List" />
      </Appbar.Header>
      <View style={styles.container}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter a to-do"
          value={input}
          onChangeText={handleInput}
        />
        <Button title="Add" onPress={handleAddTodo} />
        {todos.map((todo) => (
          <View key={todo.id} style={styles.todoItem}>
            <Text
              style={{
                textDecorationLine: todo.completed ? 'line-through' : 'none',
              }}
            >
              {todo.text}
            </Text>
            <MaterialIcons
              name="delete"
              size={24}
              color="black"
              onPress={() => handleDeleteTodo(todo.id)}
            />
            <MaterialIcons
              name="done"
              size={24}
              color="black"
              onPress={() => handleToggleCompleted(todo.id)}
            />
          </View>
        ))}
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  textInput: {
    width: '80%',
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  todoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default App;
