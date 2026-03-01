import { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { setToken, user, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.user.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data', error);
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [user]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View>
          <Text style={styles.text}>Name: {user.full_name}</Text>
          <Text style={styles.text}>Email: {user.email}</Text>
        </View>
      ) : (
        <Text>Loading...</Text>
      )}
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
});