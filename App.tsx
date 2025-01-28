import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { AppState, AppStateManager, initialAppState } from './src/AppState';
import { IapService } from './src/IapService';
import { IapticUtils } from './src/iaptic-rn';

function App(): React.JSX.Element {

  // State Variables for IAP Products (In-App Purchase Products)
  const appState = new AppStateManager(useState<AppState>(initialAppState));
  const iapService = useMemo(() => new IapService(appState), [appState]);
  const utils = new IapticUtils();

  useEffect(() => iapService.onAppStartup(), []);
  const restorePurchasesInProgress = appState.get().restorePurchasesInProgress;
  const purchaseInProgress = appState.get().purchaseInProgress;
  const activeSubscription = appState.get().activeSubscription;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.productsContainer}>
        <Text style={styles.subscriptionText}>Subscription</Text>
        
        {/* Affichage des souscriptions existantes */}
        {activeSubscription && <View key={activeSubscription.id} style={styles.subscriptionItem}>
            <Text style={styles.subscriptionTitle}>
              {activeSubscription.id}
            </Text>
            <Text style={[
              styles.subscriptionStatus,
              { color: !activeSubscription.isExpired ? 'green' : 'red' }
            ]}>
              {activeSubscription.isExpired ? 'Expired' : 'Active'}
              {activeSubscription.expiryDate && 
                ` until ${new Date(activeSubscription.expiryDate).toLocaleDateString()}`
              }
            </Text>
            {activeSubscription.isTrialPeriod && 
              <Text style={styles.trialBadge}>Trial Period</Text>
            }
          </View>
        }

        {/* Liste des produits disponibles */}
        {appState.get().availableProducts.map((product) => (
          <View key={product.id}>
            <Text>{product.title}</Text>
            {
              product.offers.map(offer => (
                <View key={offer.id}>
                  <TouchableOpacity
                    disabled={purchaseInProgress?.productId === product.id}
                    style={[
                      styles.button,
                      purchaseInProgress?.productId === product.id && styles.buttonDisabled
                    ]}
                    onPress={() => {
                      iapService.handleSubscribeButton(offer);
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {purchaseInProgress?.productId === product.id
                        ? `${purchaseInProgress.status}...`
                        : `${product.title} for ${utils.formatBillingCycleEN(offer.pricingPhases[0])}`}
                    </Text>
                  </TouchableOpacity>
                  
                  {offer.pricingPhases.length > 1 && (
                    <Text style={styles.pricingPhasesText}>
                      {offer.pricingPhases.slice(1).map((phase, index) => (
                        `then ${phase.price} for ${utils.formatBillingCycleEN(phase)}`
                      )).join('\n')}
                    </Text>
                  )}
                </View>
              ))
            }
          </View>
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
  subscriptionItem: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  trialBadge: {
    color: '#6200ee',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  pricingPhasesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 8,
  },
});

export default App;

