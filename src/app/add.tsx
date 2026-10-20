import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const token = (params.token as string) || 'mock-token';

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleBack = () => {
    // ใช้ replace แทน back เพื่อป้องกันบัคประวัติการนำทางไม่รองรับ
    router.replace({ pathname: '/', params: { logged_in: 'true', token } });
  };

  const handleAddEmployee = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) {
      showAlert('Validation Error', 'Please fill in all fields.');
      return;
    }

    const numericSalary = Number(salary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      showAlert('Validation Error', 'Salary must be a valid positive number.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), position: position.trim(), salary: numericSalary })
      });

      if (res.ok) {
        showAlert('Success', 'Employee added successfully!');
        handleBack();
      } else {
        const err = await res.json();
        showAlert('Error', err.error || 'Failed to add employee');
      }
    } catch (e) {
      showAlert('Network Error', 'Could not connect to server.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack}><Text style={styles.backText}>← Back</Text></Pressable>
        <Text style={styles.headerTitle}>Add New Employee</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Full Name (sonbor_name)</Text>
        <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />

        <Text style={styles.label}>Position (sonbor_position)</Text>
        <TextInput style={styles.input} placeholder="Enter position" placeholderTextColor="#94A3B8" value={position} onChangeText={setPosition} />

        <Text style={styles.label}>Base Salary (sonbor_salary)</Text>
        <TextInput style={styles.input} placeholder="Enter base salary" placeholderTextColor="#94A3B8" keyboardType="numeric" value={salary} onChangeText={setSalary} />

        <Pressable style={styles.btnPrimary} onPress={handleAddEmployee}>
          <Text style={styles.btnPrimaryText}>Save Employee</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  backText: { color: '#60A5FA', fontSize: 14, fontWeight: '700' },
  formCard: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  input: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16, fontSize: 15, color: '#0F172A' },
  btnPrimary: { backgroundColor: '#0F172A', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
}); 