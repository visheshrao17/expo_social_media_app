import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Snackbar } from 'react-native-paper';
import { supabase } from '../supabase';

// Helper to detect network-level failures
const isNetworkError = (error) => {
  const msg = error?.message || '';
  return msg.includes('Network request failed') || msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION');
};

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const checkUsername = async (usernameToCheck) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', usernameToCheck)
        .maybeSingle();

      if (error) {
        if (isNetworkError(error)) {
          Alert.alert(
            "Database Unreachable",
            "Cannot connect to the database. Your Supabase project may be paused (free-tier pauses after 7 days of inactivity).\n\nGo to supabase.com → your project → click 'Restore' to unpause it.",
          );
          return { error: true };
        }
        throw error;
      }
      return { exists: !!data }; // Returns true if username exists
    } catch (error) {
      console.error('Error checking username:', error);
      if (isNetworkError(error)) {
        Alert.alert(
          "Database Unreachable",
          "Cannot connect to the database. Your Supabase project may be paused (free-tier pauses after 7 days of inactivity).\n\nGo to supabase.com → your project → click 'Restore' to unpause it.",
        );
        return { error: true };
      }
      setMessage('Error checking username: ' + error.message);
      setVisible(true);
      return { error: true };
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setMessage('Please fill in all fields');
      setVisible(true);
      return;
    }

    setLoading(true);
    console.log('📝 [SIGNUP] Started signup flow...');
    console.log('📝 [SIGNUP] Email:', email, '| Username:', username);

    // 1. Check Username Uniqueness
    console.log('📝 [STEP 1] Checking if username is available...');
    const usernameResult = await checkUsername(username);
    if (usernameResult.error) {
      console.log('❌ [STEP 1] Username check failed (network/db error)');
      setLoading(false);
      return;
    }
    if (usernameResult.exists) {
      console.log('❌ [STEP 1] Username already taken');
      setMessage('Username already taken. Please choose another.');
      setVisible(true);
      setLoading(false);
      return;
    }
    console.log('✅ [STEP 1] Username is available!');

    // 2. Sign Up
    try {
      console.log('📝 [STEP 2] Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) {
        console.log('❌ [STEP 2] Auth signup error:', error.message);
        console.log('❌ [STEP 2] Error details:', JSON.stringify(error));
        if (isNetworkError(error)) {
          Alert.alert("Network Error", "Cannot reach the authentication server. Please check your internet connection.");
        } else {
          setMessage(error.message);
          setVisible(true);
        }
        setLoading(false);
        return;
      }

      console.log('✅ [STEP 2] Auth signup successful!');
      console.log('📝 [STEP 2] User ID:', data?.user?.id);
      console.log('📝 [STEP 2] Session exists:', !!data?.session);

      // 3. Create user profile
      if (data?.user) {
        console.log('📝 [STEP 3] Creating profile in database...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: username,
              email: email
            }
          ]);

        if (profileError) {
          console.error('❌ [STEP 3] Profile creation error:', JSON.stringify(profileError));
          if (isNetworkError(profileError)) {
            Alert.alert(
              "Profile Creation Failed",
              "Account was created but the database is unreachable to set up your profile.\n\nYour Supabase project may be paused. Go to supabase.com → your project → click 'Restore'."
            );
          } else {
            const errorMsg = profileError.message + (profileError.details ? ` (${profileError.details})` : '');
            setMessage(`Account created but profile setup failed: ${errorMsg}`);
            setVisible(true);
          }
        } else {
          console.log('✅ [STEP 3] Profile created successfully!');
          setMessage('Account created successfully!');
          setVisible(true);

          // If session exists, App.js will automatically switch to MainTabs
          // No need to navigate manually
        }
      } else {
        console.log('⚠️ [STEP 2] No user returned from signUp (email confirmation might be required)');
      }
    } catch (err) {
      console.error('❌ [SIGNUP] Unexpected error:', err.message);
      console.error('❌ [SIGNUP] Full error:', JSON.stringify(err));
      if (isNetworkError(err)) {
        Alert.alert("Network Error", "Cannot connect to the server. Please check your internet connection.");
      } else {
        setMessage('An unexpected error occurred: ' + err.message);
        setVisible(true);
      }
    }
    console.log('📝 [SIGNUP] Flow completed.');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
      >
        {message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 10,
  },
});