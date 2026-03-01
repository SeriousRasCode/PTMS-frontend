import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../utils/api';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProjectDetails = async () => {
      try {
        const [allProjects, projectTasks] = await Promise.all([
          api.project.getMyProjects(),
          api.task.getTasksByProject(Number(id)),
        ]);
        
        const foundProject = allProjects.find((p) => p.id === Number(id));
        setProject(foundProject);
        setTasks(projectTasks);

      } catch (error) {
        console.error('Failed to fetch project details', error);
        Alert.alert('Error', 'Failed to fetch project details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItemContainer}>
      <Text style={styles.taskItemTitle}>{item.title}</Text>
      <Text>{item.description}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!project) {
    return <Text>Project not found.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <Text style={styles.description}>{project.description}</Text>
      <Text style={styles.subtitle}>Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskItemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
