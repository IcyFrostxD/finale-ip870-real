import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  sonbor_ID_Employ?: number;
}

interface AIPredictionResult {
  currentSalary: number;
  marketAverage: number;
  healthStatus: string;
  suggestedIncreasePercent: number;
  recommendedNewSalary: number;
  monthlyDifference: number;
  aiReasoning: string;
}

export default function AISalaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchingEmp, setFetchingEmp] = useState(true);
  const [result, setResult] = useState<AIPredictionResult | null>(null);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  // ดึงรายชื่อพนักงานทั้งหมดจากฐานข้อมูลเมื่อเปิดหน้าจอ
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
        setSelectedEmpId(String(data[0].sonbor_ID_Employ || data[0].id));
        setSelectedEmp(data[0]);
      }
    } catch (e) {
      showAlert('Error', 'Failed to load employee directory.');
    } finally {
      setFetchingEmp(false);
    }
  };

  // เมื่อเลือกพนักงานจากลิสต์ ให้อัปเดตข้อมูลตำแหน่งและเงินเดือนอัตโนมัติ
  const handleSelectEmployee = (id: string) => {
    setSelectedEmpId(id);
    const emp = employees.find(e => String(e.sonbor_ID_Employ || e.id) === String(id));
    if (emp) setSelectedEmp(emp);
    setResult(null); // รีเซ็ตผลการวิเคราะห์เก่า
  };

  const handlePredict = async () => {
    if (!selectedEmp) {
      showAlert('Validation Error', 'Please select an employee.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/ai-salary-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSalary: Number(selectedEmp.salary),
          position: selectedEmp.position
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.prediction);
      } else {
        showAlert('Error', 'AI analysis failed.');
      }
    } catch (e) {
      showAlert('Network Error', 'Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>
        <Text style={styles.headerTitle}>AI Salary Predictor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Employee for AI Evaluation</Text>
          <Text style={styles.cardSub}>Choose an employee to auto-fill position and current salary.</Text>

          <Text style={styles.label}>Select Employee</Text>
          {fetchingEmp ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.chipContainer}>
              {employees.map((emp) => {
                const empId = String(emp.sonbor_ID_Employ || emp.id);
                const isSelected = selectedEmpId === empId;
                return (
                  <Pressable
                    key={empId}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleSelectEmployee(empId)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {emp.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* แสดงข้อมูลอัตโนมัติของพนักงานที่เลือก */}
          {selectedEmp && (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoVal}>{selectedEmp.position}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Salary:</Text>
                <Text style={[styles.infoVal, { color: '#059669' }]}>THB {Number(selectedEmp.salary).toLocaleString()}</Text>
              </View>
            </View>
          )}

          <Pressable style={[styles.btnPrimary, loading && { opacity: 0.7 }]} onPress={handlePredict} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Run AI Analysis</Text>}
          </Pressable>
        </View>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultHeader}>AI Recommendation Report</Text>
            
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Health Status:</Text>
              <Text style={[styles.rowVal, { color: result.healthStatus.includes('Underpaid') ? '#DC2626' : '#059669' }]}>
                {result.healthStatus}
              </Text>
            </View>

            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Internal Market Avg:</Text>
              <Text style={styles.rowVal}>THB {result.marketAverage.toLocaleString()}</Text>
            </View>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>Recommended Merit Increase</Text>
              <Text style={styles.highlightPercent}>+{result.suggestedIncreasePercent}%</Text>
              <Text style={styles.highlightSub}>
                New Suggested Salary: <Text style={{ fontWeight: '900', color: '#0F172A' }}>THB {result.recommendedNewSalary.toLocaleString()}</Text> (+{result.monthlyDifference.toLocaleString()} THB/mo)
              </Text>
            </View>

            <Text style={styles.reasoningTitle}>AI Reasoning & Insights:</Text>
            <Text style={styles.reasoningText}>{result.aiReasoning}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  backText: { color: '#60A5FA', fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  chipTextSelected: { color: '#FFFFFF' },
  infoBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  infoVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  btnPrimary: { backgroundColor: '#2563EB', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  resultHeader: { fontSize: 17, fontWeight: '900', color: '#1E3A8A', marginBottom: 14 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  rowVal: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  highlightBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, alignItems: 'center', marginVertical: 16, borderWidth: 1, borderColor: '#DBEAFE' },
  highlightTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase', marginBottom: 4 },
  highlightPercent: { fontSize: 32, fontWeight: '900', color: '#2563EB', marginVertical: 2 },
  highlightSub: { fontSize: 13, color: '#475569', textAlign: 'center' },
  reasoningTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  reasoningText: { fontSize: 13, color: '#475569', lineHeight: 20, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 }
});