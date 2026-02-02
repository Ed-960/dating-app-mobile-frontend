import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, isAuthenticating } = useAuth();

  return (
    <View style={styles.container}>
      <Ionicons name="heart" size={100} color="#FF6B9D" />

      <Text style={styles.title}>Dating App</Text>
      <Text style={styles.subtitle}>Find your perfect match</Text>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isAuthenticating && styles.buttonDisabled,
        ]}
        onPress={signIn}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="logo-google" size={24} color="white" />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.disclaimer}>
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 30,
    color: '#333',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
    marginBottom: 80,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB4437',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 280,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
