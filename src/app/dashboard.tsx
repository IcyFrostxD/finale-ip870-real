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
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

interface SalaryCluster {
  group: string;
  centroid: number;
  count: number;
}

export default function DashboardMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const isLoggedIn = params.logged_in === 'true' && !!params.token;
  const [clusters, setClusters] = useState<SalaryCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        router.replace('/login');
      } else {
        fetchEmployeeCount();
      }
    }, [isLoggedIn])
  );

  const fetchEmployeeCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (Array.isArray(data)) setTotalEmployees(data.length);
    } catch (e) {
      console.error(e);
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

  if (!isLoggedIn) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>HR Manager Dashboard</Text>
          <Text style={styles.headerSub}>Employees System</Text>
        </View>
        <Pressable style={styles.btnLogout} onPress={() => router.replace('/login')}>
          <Text style={styles.btnLogoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* เมนูปุ่มทางลัด */}
        <View style={styles.menuGrid}>
          <Pressable style={styles.menuCard} onPress={() => router.push('/add')}>
            <Text style={styles.menuIcon}>➕</Text>
            <Text style={styles.menuTitle}>Add Employee</Text>
            <Text style={styles.menuDesc}>Insert new record</Text>
          </Pressable>

          <Pressable style={styles.menuCard} onPress={() => router.push('/crud')}>
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuTitle}>Manage CRUD</Text>
            <Text style={styles.menuDesc}>View & Toggle Status</Text>
          </Pressable>
        </View>

        {/* สถิติรวม */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Employees in Database</Text>
          <Text style={styles.statsValue}>{totalEmployees} Persons</Text>
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
  menuGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  menuCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuIcon: { fontSize: 28, marginBottom: 8 },
  menuTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  menuDesc: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  statsCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center' },
  statsLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  statsValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
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
  clusterCountText: { fontSize: 11, fontWeight: '800', color: '#1D4ED8' }
});