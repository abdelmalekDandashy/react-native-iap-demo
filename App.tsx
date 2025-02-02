import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, Text, ScrollView } from 'react-native';
import { IapticRN, IapticSubscriptionView } from 'react-native-iaptic';
import { AppStateManager, initialAppState } from './src/AppState';
import { AppService } from './src/AppService';

// Create stable references outside component
let appStateManagerInstance: AppStateManager | null = null;
let iapServiceInstance: AppService | null = null;

function App(): React.JSX.Element {
  const [appState, setAppState] = useState(initialAppState);

  // Initialize singleton instances once
  const appStateManager = useRef<AppStateManager>(
    appStateManagerInstance || (appStateManagerInstance = new AppStateManager([appState, setAppState]))
  ).current;

  const iapService = useRef<AppService>(
    iapServiceInstance || (iapServiceInstance = new AppService(appStateManager))
  ).current;

  // One-time initialization with proper cleanup
  useEffect(() => iapService.onAppStartup(), []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.productsContainer}>
        <Text style={styles.subscriptionText}>Subscription</Text>

        {/* <IapticActiveSubscription /> */}

        {/* A feature that will only be available if the user has any subscription */}
        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess("basic")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Basic Access: {appState.entitlements.includes('basic') ? 'Granted' : 'Locked'}</Text>
        </TouchableOpacity>

        {/* A feature that will only be available if the user has a premium subscription */}
        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess("premium")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Premium Access: {appState.entitlements.includes('premium') ? 'Granted' : 'Locked'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.subscriptionButton,
          ]}
          onPress={() => {
            IapticRN.presentSubscriptionView();
          }}
        >
          <Text style={styles.buttonText}>{!appState.entitlements.includes('basic') ? 'Subscribe To Unlock' : 'Manage Subscription'}</Text>
        </TouchableOpacity>

      </ScrollView>
      <IapticSubscriptionView
        entitlementLabels={{
          basic: {
            label: "Basic Access",
            detail: "Access to More Basic Features"
          },
          premium: {
            label: "Premium Access",
            detail: "Access to All Premium Features"
          },
          pro: {
            label: "Pro Access",
            detail: "Access to All Pro Features"
          }
        }} onPurchaseComplete={() => {
          iapService.handlePurchaseComplete();
        }}
        termsUrl='https://www.iaptic.com/legal/terms-and-conditions'
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  productsContainer: {
    padding: 10,
    gap: 10,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  restoreText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  subscriptionButton: {
    marginTop: 20,
    backgroundColor: '#5856D6',
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default App;

