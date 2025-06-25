import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView } from 'react-native';
import { IapticRN } from 'react-native-iaptic';
import { AppStateManager, initialAppState } from './src/AppState';
import { AppService } from './src/AppService';
import { SubscriptionScreen } from './src/SubscriptionScreen';
import { singletons } from './src/singletons';

// Persist singletons



/**
 * Main App component
 */
function App(): React.JSX.Element {
  const [appState, setAppState] = useState(initialAppState);
  const [showSubs, setShowSubs] = useState(false);

  // Instantiate singletons once
  const appStateManager = useRef<AppStateManager>(
    singletons.appStateManagerInstance ||
      (singletons.appStateManagerInstance = new AppStateManager([appState, setAppState]))
  ).current;

  const iapService = useRef<AppService>(
    singletons.iapServiceInstance ||
      (singletons.iapServiceInstance = new AppService(appStateManager))
  ).current;

  // One-time setup: initialize Iaptic and fetch products
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        cleanup = await iapService.onAppStartup();
        await IapticRN.loadProducts();
      } catch (err) {
        console.warn('Iaptic setup error:', err);
      }
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (showSubs) {
    return <SubscriptionScreen onClose={() => setShowSubs(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.productsContainer}>
        <Text style={styles.subscriptionText}>Tapyn Subscription</Text>

        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess('weekly_plan')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Access: {appState.entitlements.includes('tapyn') ? 'Granted' : 'Locked'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.subscriptionButton]}
          onPress={() => setShowSubs(true)}
        >
          <Text style={styles.buttonText}>
            {appState.entitlements.includes('weekly_plan') ? 'Manage Subscription' : 'Subscribe To Unlock'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main screen styles
  container: { flex: 1 },
  productsContainer: { padding: 16, gap: 12 },
  subscriptionText: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  subscriptionButton: { marginTop: 16, backgroundColor: '#5856D6' },
  buttonText: { color: '#fff', fontSize: 16 },
});

export default App;
