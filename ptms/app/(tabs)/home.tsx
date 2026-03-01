import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, taskData] = await Promise.all([
          api.project.getMyProjects(),
          api.task.getMyTasks(),
        ]);
        setData({ projects: projectData, tasks: taskData });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        Alert.alert('Error', 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.full_name || 'User'}!</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{data.projects.length}</Text>
          <Text style={styles.summaryLabel}>Projects</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{data.tasks.length}</Text>
          <Text style={styles.summaryLabel}>Tasks</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 16,
  },
});
