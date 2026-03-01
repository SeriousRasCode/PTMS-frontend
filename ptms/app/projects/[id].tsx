import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, Button, Modal, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../utils/api';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    start_date: new Date().toISOString().split('T')[0], // Default to today
    due_date: new Date().toISOString().split('T')[0], // Default to today
    status: "not_started",
    progress_percentage: 0,
  });

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [allProjects, projectTasks] = await Promise.all([
        api.project.getMyProjects(),
        api.task.getTasksByProject(Number(id)),
      ]);
      
      const foundProject = allProjects.find((p: any) => p.id === Number(id));
      setProject(foundProject);
      setTasks(projectTasks);

    } catch (error) {
      console.error('Failed to fetch project details', error);
      Alert.alert('Error', 'Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchProjectDetails();
  }, [id]);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await api.task.createTask(Number(id), newTask);
      setModalVisible(false);
      setNewTask({
        title: "",
        description: "",
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: "not_started",
        progress_percentage: 0,
      });
      // Refresh tasks
      const projectTasks = await api.task.getTasksByProject(Number(id));
      setTasks(projectTasks);
    } catch (error) {
      console.error('Failed to create task', error);
      Alert.alert('Error', 'Failed to create task.');
    }
  };

  const renderTaskItem = ({ item }: { item: any }) => (
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
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Tasks</Text>
        <Button title="Create Task" onPress={() => setModalVisible(true)} />
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id.toString()}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task Title"
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Task Description"
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
            />
            <Button title="Create" onPress={handleCreateTask} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
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
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
