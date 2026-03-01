import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken, setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      const response = await api.auth.login({ email, password });
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        setToken(response.token);

        // Optionally, fetch user data after login
        const userResponse = await api.user.getMe();
        setUser(userResponse);
        
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Error', 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Link href="/auth/register" style={styles.link}>
        Don't have an account? Register
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: 'blue',
  },
});
