import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Mail, Lock, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

// NEW IMPORTS for Firebase and API calls
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to check if OTP is required
  const checkOtpRequired = async (firebaseUid) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/otp/is-required`, { firebaseUid });
      return response.data.otpRequired;
    } catch (err) {
      // fallback: require OTP if error
      return true;
    }
  };

  // Helper to fetch user profile from DB and get their actual role
  const fetchUserProfile = async (firebaseUid) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/${firebaseUid}`, {
        headers: {
          'bypass-tunnel-reminder': 'true',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (err) {
      // Return null if user profile doesn't exist in DB (404)
      if (err.response && err.response.status === 404) {
        return null;
      }
      throw err; // Re-throw other errors (network, 500, etc.)
    }
  };

  // Navigate to the correct screen based on the user's actual role
  const navigateByRole = (userRole) => {
    if (userRole === 'admin') {
      navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
    } else if (userRole === 'authority') {
      navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
    }
  };

  const handleLogin = async () => {
    // Basic Validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Fetch the user's actual profile from the DB to validate role
      const userProfile = await fetchUserProfile(firebaseUser.uid);

      // If the user doesn't have a profile in the DB yet, they need to sign up
      if (!userProfile) {
        setError('User profile not found in database. Please sign up first.');
        return;
      }

      const actualRole = userProfile.role;

      // 3. Validate the selected role matches the user's actual role in the DB
      if (actualRole && actualRole !== role) {
        const roleLabel = actualRole.charAt(0).toUpperCase() + actualRole.slice(1);
        const selectedLabel = role.charAt(0).toUpperCase() + role.slice(1);
        setError(`This account is registered as "${roleLabel}". You selected "${selectedLabel}". Please select the correct role.`);
        return;
      }

      // 4. Check if OTP is required
      const otpRequired = await checkOtpRequired(firebaseUser.uid);

      if (!otpRequired) {
        // Persist user session with full profile data
        await AsyncStorage.setItem('userData', JSON.stringify(userProfile));
        await AsyncStorage.setItem('userToken', firebaseUser.uid);
        // Navigate to the correct dashboard based on actual role
        navigateByRole(actualRole);
        return;
      }

      // 5. Request login OTP challenge as before
      const response = await axios.post(`${API_URL}/api/auth/login/request-otp`, {
        firebaseUid: firebaseUser.uid,
      }, {
        headers: {
          'bypass-tunnel-reminder': 'true',
          'Content-Type': 'application/json'
        }
      });

      const challengeData = response.data;
      navigation.navigate('EmailOtp', {
        purpose: 'login',
        challengeId: challengeData.challengeId,
        email: challengeData.email || email,
        firebaseUid: firebaseUser.uid,
      });

    } catch (error) {
      console.error('Login Error:', error);
      let message = 'Login failed. Please check your credentials.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (error.message.includes('Network Error') || error.response === undefined) {
        message = 'Server connection failed. Is your backend and Localtunnel running?';
      } else if (error.response && error.response.status === 404) {
        message = 'User profile not found in database. Please sign up first.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white' }}>
        <View style={styles.header}>
          <Building2 size={64} color="white" />
          <Text style={styles.headerTitle}>CityZen</Text>
          <Text style={styles.headerSubtitle}>Better City, Better Life</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>

          {/* Error Box */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={20} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Role Selector - used to validate the user's actual role matches their selection */}
          <View style={styles.roleContainer}>
            {['citizen', 'authority', 'admin'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === 'citizen' && (
            <Text style={styles.noteText}>
              <Text style={{ fontWeight: 'bold' }}>Note:</Text> Citizen identity remains hidden from other users.
            </Text>
          )}

          {/* Inputs */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => console.log('Forgot')} style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
            <Text style={{ color: '#1E88E5', fontWeight: '500' }}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginBtn, isLoading && styles.btnDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { height: 240, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', borderBottomRightRadius: 40, borderBottomLeftRadius: 40 },
  headerTitle: { fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 10 },
  headerSubtitle: { color: '#BFDBFE', fontSize: 16 },
  formContainer: { padding: 24, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  errorBox: { flexDirection: 'row', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center', gap: 8 },
  errorText: { color: '#B91C1C', fontSize: 14 },
  roleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 12 },
  roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  roleBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  roleText: { color: '#6B7280', fontWeight: '600', fontSize: 12 },
  roleTextActive: { color: '#1E88E5', fontWeight: 'bold' },
  noteText: { fontSize: 12, color: '#6B7280', marginBottom: 16, textAlign: 'center', fontStyle: 'italic' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
  loginBtn: { backgroundColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E88E5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { backgroundColor: '#93C5FD' },
  loginBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 10, color: '#9CA3AF' },
  secondaryBtn: { borderWidth: 1, borderColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#1E88E5', fontSize: 16, fontWeight: '600' }
});
