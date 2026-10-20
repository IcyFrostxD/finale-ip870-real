import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

interface Employee {
  id: string;
  name: string;
  position: string;
  status: 'Active' | 'On Leave';
  salary: number;
  sonbor_ID_Employ?: number;
}

interface SalaryCluster {
  group: string;
  centroid: number;
  count: number;
}

export default function IndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const token = (params.token as string) || 'mock-token';
  const isLoggedIn = params.logged_in === 'true' && !!token;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clusters, setClusters] = useState<SalaryCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        router.replace('/login');
      } else {
        fetchEmployees();
      }
    }, [isLoggedIn])
  );

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (e) {
      console.error(e);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEmployees();
    } catch (error) {
      showAlert('Error', 'Failed to delete employee.');
    }
  };

  const handleDeleteEmployee = (id: string, empName: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete ${empName}?`)) executeDelete(id);
    } else {
      Alert.alert('Are you sure?', `Remove ${empName} from system?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => executeDelete(id) }
      ]);
    }
  };

  const handleAnalyzeSalaries = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await fetch(`${API_BASE_URL}/employees/salary-clusters`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClusters(data.clusters);
      } else {
        showAlert('Error', 'Failed to analyze salary structure.');
      }
    } catch (error) {
      showAlert('Network Error', 'Failed to connect.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HR Manager Home</Text>
          <Text style={styles.headerSub}>Sonbor_Employees System</Text>
        </View>
        <Pressable style={styles.btnLogout} onPress={() => router.replace('/login')}>
          <Text style={styles.btnLogoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* แผงปุ่มเมนูลัดรวมถึงปุ่ม AI Predictor */}
        <View style={styles.menuGrid}>
          <Pressable 
            style={[styles.menuCard, styles.dashboardCard]} 
            onPress={() => router.push({ pathname: '/', params: { logged_in: 'true', token } })}
          >
            <Text style={styles.menuIcon}></Text>
            <Text style={styles.menuTitleActive}>Dashboard</Text>
            <Text style={styles.menuDesc}>Overview</Text>
          </Pressable>

          <Pressable 
            style={styles.menuCard} 
            onPress={() => router.push({ pathname: '/add', params: { logged_in: 'true', token } })}
          >
            <Text style={styles.menuIcon}></Text>
            <Text style={styles.menuTitle}>Add</Text>
            <Text style={styles.menuDesc}>New Employee</Text>
          </Pressable>

          <Pressable 
            style={styles.menuCard} 
            onPress={() => router.push({ pathname: '/ai-salary', params: { logged_in: 'true', token } })}
          >
            <Text style={styles.menuIcon}></Text>
            <Text style={styles.menuTitle}>AI Predictor</Text>
            <Text style={styles.menuDesc}>Smart Salary</Text>
          </Pressable>
        </View>

        {/* ช่องค้นหาพนักงาน */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search employee by name or position..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ส่วนวิเคราะห์ K-Means Salary Analytics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>K-Means Salary Analytics (k = 3)</Text>
          <Pressable style={[styles.btnAnalyze, isAnalyzing && { opacity: 0.7 }]} onPress={handleAnalyzeSalaries} disabled={isAnalyzing}>
            <Text style={styles.btnAnalyzeText}>Analyze Salary Structure</Text>
          </Pressable>

          {isAnalyzing && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Running 1D K-Means Clustering...</Text>
            </View>
          )}

          {!isAnalyzing && clusters.length > 0 && (
            <View style={styles.clusterGrid}>
              {clusters.map((c, index) => (
                <View key={index} style={styles.clusterCard}>
                  <Text style={styles.clusterTier}>{c.group}</Text>
                  <Text style={styles.clusterSalary}>THB {Number(c.centroid).toLocaleString()}</Text>
                  <Text style={styles.clusterSub}>Avg Salary</Text>
                  <View style={styles.clusterCountBadge}>
                    <Text style={styles.clusterCountText}>{c.count} Persons</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* รายชื่อพนักงาน (Employee Directory) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Employee Directory ({filteredEmployees.length})</Text>
          {filteredEmployees.length === 0 ? (
            <Text style={styles.noResultText}>No employees found matching "{searchQuery}"</Text>
          ) : (
            filteredEmployees.map((emp) => {
              const isActive = emp.status === 'Active';
              const empId = String(emp.sonbor_ID_Employ || emp.id);
              return (
                <View key={empId} style={styles.empCard}>
                  <View style={styles.empInfo}>
                    <Text style={styles.empId}>sonbor_ID_Employ: #{empId}</Text>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empPosition}>{emp.position}</Text>
                    <Text style={styles.empSalary}>Salary: THB {Number(emp.salary).toLocaleString()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Text style={[styles.statusText, { color: isActive ? '#15803D' : '#B45309' }]}>{emp.status}</Text>
                    </View>
                  </View>
                  <View style={styles.empActions}>
                    <Pressable 
                      style={styles.btnEdit} 
                      onPress={() => router.push({ pathname: '/edit', params: { id: empId, logged_in: 'true', token } })}
                    >
                      <Text style={styles.btnEditText}>Edit</Text>
                    </Pressable>
                    <Pressable style={styles.btnDelete} onPress={() => handleDeleteEmployee(empId, emp.name)}>
                      <Text style={styles.btnDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  btnLogout: { backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnLogoutText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  menuGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  menuCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dashboardCard: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  menuIcon: { fontSize: 22, marginBottom: 4 },
  menuTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  menuTitleActive: { fontSize: 13, fontWeight: '900', color: '#1D4ED8', marginBottom: 2 },
  menuDesc: { fontSize: 10, color: '#64748B', textAlign: 'center' },
  searchContainer: { marginBottom: 16 },
  searchInput: { height: 48, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#0F172A' },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 14 },
  btnAnalyze: { backgroundColor: '#2563EB', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnAnalyzeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 8, color: '#475569', fontWeight: '600', fontSize: 13 },
  clusterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16, gap: 10 },
  clusterCard: { flex: 1, minWidth: 100, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, padding: 12, alignItems: 'center' },
  clusterTier: { fontSize: 14, fontWeight: '900', color: '#1E40AF', marginBottom: 4 },
  clusterSalary: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  clusterSub: { fontSize: 11, color: '#64748B', marginBottom: 8 },
  clusterCountBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  clusterCountText: { fontSize: 11, fontWeight: '800', color: '#1D4ED8' },
  noResultText: { textAlign: 'center', color: '#64748B', paddingVertical: 20, fontStyle: 'italic' },
  empCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  empInfo: { flex: 1, paddingRight: 12 },
  empId: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  empName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  empPosition: { fontSize: 13, color: '#475569', marginTop: 2 },
  empSalary: { fontSize: 14, fontWeight: '800', color: '#059669', marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  empActions: { gap: 8 },
  btnEdit: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnEditText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  btnDelete: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});