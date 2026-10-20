import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://119.59.102.161:3095/api';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        router.replace({
          pathname: '/',
          params: { token: data.token || 'mock-token', logged_in: 'true' }
        });
      } else {
        showAlert('Login Failed', data.message || 'Invalid username or password');
      }
    } catch (error) {
      showAlert('Network Error', 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.badge}><Text style={styles.badgeText}>HR SYSTEM</Text></View>
        <Text style={styles.title}>HR Manager Login</Text>
        <Text style={styles.subtitle}>Sign in to manage employees & salary analytics</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="Enter username" placeholderTextColor="#94A3B8" value={username} onChangeText={setUsername} autoCapitalize="none" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#94A3B8" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <Pressable style={[styles.btnLogin, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnLoginText}>Sign In</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  badgeText: { color: '#1D4ED8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase' },
  input: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#0F172A' },
  btnLogin: { height: 50, backgroundColor: '#0F172A', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnLoginText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});