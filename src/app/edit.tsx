import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

export default function EditEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const employeeId = params.id as string;

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const emp = data.find(e => String(e.id) === String(employeeId) || String(e.sonbor_ID_Employ) === String(employeeId));
        if (emp) {
          setName(emp.name || emp.sonbor_name);
          setPosition(emp.position || emp.sonbor_position);
          setSalary(String(emp.salary || emp.sonbor_salary));
        }
      }
    } catch (e) {
      showAlert('Error', 'Failed to load employee details.');
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) {
      showAlert('Validation Error', 'All fields are required.');
      return;
    }

    const numericSalary = Number(salary);
    if (isNaN(numericSalary) || numericSalary <= 0) {
      showAlert('Validation Error', 'Salary must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          position: position.trim(),
          salary: numericSalary
        })
      });

      if (res.ok) {
        showAlert('Success', 'Employee updated successfully!');
        router.back();
      } else {
        const err = await res.json();
        showAlert('Error', err.error || 'Failed to update employee.');
      }
    } catch (e) {
      showAlert('Network Error', 'Cannot connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading employee data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Employee</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Position</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter position"
          placeholderTextColor="#94A3B8"
          value={position}
          onChangeText={setPosition}
        />

        <Text style={styles.label}>Base Salary</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter salary"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={salary}
          onChangeText={setSalary}
        />

        <Pressable
          style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>Update Changes</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontWeight: '600' },
  header: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  backText: { color: '#60A5FA', fontSize: 14, fontWeight: '700' },
  formCard: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  input: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16, fontSize: 15, color: '#0F172A' },
  btnPrimary: { backgroundColor: '#2563EB', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});