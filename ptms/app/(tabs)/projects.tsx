import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  Alert, Pressable, ScrollView, Modal, TextInput, TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, projectAPI, teamAPI } from '../../utils/api';
import { useAuth } from '../context/AuthContext';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  team_name: string;
  manager_name: string;
}

export default function ProjectsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Create Project State
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    team_id: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let response;
      if (user?.role === "Admin") {
        response = await projectAPI.getAllProjects();
      } else {
        response = await projectAPI.getMyProjects();
      }
      
      // Supporting both direct array and { data: [] } formats
      const projectsList = response.data || response || [];
      setProjects(projectsList);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getMyTeams();
      setTeams(response.data || []);
    } catch (err) {
      console.log("Teams fetch failed", err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.team_id) {
      Alert.alert("Error", "Please fill in name and team");
      return;
    }
    try {
      await projectAPI.createProject({
        ...newProject,
        team_id: parseInt(newProject.team_id)
      });
      setModalVisible(false);
      fetchProjects();
      Alert.alert("Success", "Project created!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return { backgroundColor: '#4ade80' };
    if (s === 'active' || s === 'in progress') return { backgroundColor: '#3b82f6' };
    return { backgroundColor: '#9ca3af' };
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <Pressable 
      style={styles.card} 
      onPress={() => router.push(`/projects/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.projectTitle}>{item.name}</Text>
        <View style={[styles.badge, getStatusStyle(item.status)]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>👥 {item.team_name}</Text>
        <Text style={styles.footerText}>📅 {new Date(item.start_date).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );

  if (loading) return <ActivityIndicator size="large" style={styles.center} color="#0f5841" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Projects</Text>
        {(user?.role === "Admin" || user?.role === "Manager") && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No projects found.</Text>}
      />

      {/* Create Project Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Project</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Project Name" 
              onChangeText={(t) => setNewProject({...newProject, name: t})}
            />
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              placeholder="Description" 
              multiline 
              onChangeText={(t) => setNewProject({...newProject, description: t})}
            />
            
            <Text style={styles.label}>Select Team ID (Number):</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Team ID" 
              keyboardType="numeric"
              onChangeText={(t) => setNewProject({...newProject, team_id: t})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCreate} onPress={handleCreateProject}>
                <Text style={{color: '#fff'}}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  addButton: { backgroundColor: '#0f5841', padding: 10, borderRadius: 8 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  projectTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  description: { color: '#4b5563', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', pt: 8 },
  footerText: { fontSize: 12, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 5, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { padding: 12 },
  btnCreate: { backgroundColor: '#0f5841', padding: 12, borderRadius: 8 }
});