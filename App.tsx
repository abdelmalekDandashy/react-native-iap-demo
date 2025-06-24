import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, Text, ScrollView } from 'react-native';
import { IapticRN, IapticSubscriptionView } from 'react-native-iaptic';
import { AppStateManager, initialAppState } from './src/AppState';
import { AppService } from './src/AppService';
import { Config } from './src/Config';

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


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.productsContainer}>
        <Text style={styles.subscriptionText}>Subscriptions</Text>

        {/* Buttons to check each subscription entitlement */}
        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess('male')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Male Subscription: {appState.entitlements.includes('male') ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess('tapyn')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Tapyn Subscription: {appState.entitlements.includes('tapyn') ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess('infinity')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Infinity Subscription: {appState.entitlements.includes('infinity') ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => iapService.checkFeatureAccess('halloween')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Halloween Subscription: {appState.entitlements.includes('halloween') ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>

        {/* Button to open the subscription view */}
        <TouchableOpacity
          style={[styles.button, styles.subscriptionButton]}
          onPress={() => IapticRN.presentSubscriptionView()}
        >
          <Text style={styles.buttonText}>
            {!appState.entitlements.length ? 'Subscribe To Unlock' : 'Manage Subscriptions'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <IapticSubscriptionView
        entitlementLabels={{
          male: {
            label: 'Male Subscription',
            detail: 'Unlock special male-only features',
          },
          tapyn: {
            label: 'Tapyn Subscription',
            detail: 'Full access to Tapyn premium features',
          },
          infinity: {
            label: 'Infinity Subscription',
            detail: 'Yearly/monthly unlimited access',
          },
          halloween: {
            label: 'Halloween Special',
            detail: 'Seasonal spooky perks',
          },
        }}
        onPurchaseComplete={() => {
          iapService.handlePurchaseComplete();
        }}
        termsUrl="https://www.iaptic.com/legal/terms-and-conditions"
        theme={{
          primaryColor: '#FF7A00',
          secondaryColor: '#FF0000',
        }}
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
  subscriptionButton: {
    marginTop: 20,
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default App;