import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { AppState, AppStateManager, initialAppState } from './src/AppState';
import { IapService } from './src/IapService';

function App(): React.JSX.Element {

  // State Variables for IAP Products (In-App Purchase Products)
  const appState = new AppStateManager(useState<AppState>(initialAppState));
  const iapService = useMemo(() => new IapService(appState), [appState]);

  useEffect(() => iapService.onAppStartup(), []);
  const restorePurchasesInProgress = appState.get().restorePurchasesInProgress;
  const purchaseInProgress = appState.get().purchaseInProgress;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.productsContainer}>
        <Text style={styles.tokenText}>Tokens: {appState.get().tokens}</Text>
        {appState.get().availableProducts.map((product) => (
          <TouchableOpacity
            key={product.productId}
            disabled={purchaseInProgress?.productId === product.productId}
            style={[
              styles.button,
              purchaseInProgress?.productId === product.productId && styles.buttonDisabled
            ]}
            onPress={() => {
              iapService.handlePurchaseButton(product);
            }}
          >
            <Text style={styles.buttonText}>
              {purchaseInProgress?.productId === product.productId
                ? `${purchaseInProgress.status}...`
                : `${product.title} - ${product.localizedPrice}`}
            </Text>
          </TouchableOpacity>
        ))}
        
        <Text style={styles.restoreText}>
          Previously purchased items? Restore them here:
        </Text>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.restoreButton,
            restorePurchasesInProgress && styles.buttonDisabled
          ]}
          disabled={!!restorePurchasesInProgress}
          onPress={() => {
            iapService.restorePurchases();
          }}
        >
          <Text style={styles.buttonText}>
            {restorePurchasesInProgress 
              ? restorePurchasesInProgress.numDone === 0
              ? '...'
              : `${restorePurchasesInProgress.numDone}/${restorePurchasesInProgress.total}`
              : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Rendered: {new Date().toISOString().slice(11, 23)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  productsContainer: {
    padding: 10,
    gap: 10,
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
  tokenText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  restoreText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#666',
  },
  restoreButton: {
    backgroundColor: '#5856D6', // Different color to distinguish from purchase buttons
  },
});

export default App;

