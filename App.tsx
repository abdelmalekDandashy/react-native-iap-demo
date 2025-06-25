import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { IapticRN, IapticProduct, IapticOffer } from 'react-native-iaptic';
import { AppStateManager, initialAppState } from './src/AppState';
import { AppService } from './src/AppService';

// Persist singletons
let appStateManagerInstance: AppStateManager | null = null;
let iapServiceInstance: AppService | null = null;

/**
 * Screen displaying custom subscription products
 */
function SubscriptionScreen({ onClose }: { onClose: () => void }) {
  const [subscriptions, setSubscriptions] = useState<IapticProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Ensure products are loaded
        // await IapticRN.loadProducts();
        // Fetch all products, then filter for auto-renewable subscriptions
     
        // once you know the current user’s ID:
        const myUserId = 'user_12345'; // e.g. from your auth context
        await IapticRN.setApplicationUsername(myUserId);


        const all = IapticRN.getProducts();
        const subs = all.filter(
          p => p.type === 'paid subscription' || 'consumable',
        );
        setSubscriptions(subs);
      } catch (err) {
        console.warn('Error loading subscription products:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = async (offer: IapticOffer, productId: string) => {
    console.log('productId',productId)
    console.log('offer',productId)
    try {
      setPurchasingId(productId);
      await IapticRN.order(offer);
      iapServiceInstance?.handlePurchaseComplete();
    } catch (err) {
      console.warn('Purchase error:', err);
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading subscriptions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <FlatList
        data={subscriptions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const offer: IapticOffer = item.offers[0];
          const entitlements = (item as any).entitlements || [];
          const hasAccess = entitlements.some((e: string) =>
            {appStateManagerInstance?.getState().entitlements.includes(e),
            console.log('e', e)}
          );

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.id}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>{offer.pricingPhases[0].price}</Text>
              <Text style={styles.detail}>{offer.pricingPhases[0].billingPeriod}</Text>
              <TouchableOpacity
                style={styles.button}
                disabled={purchasingId === item.id}
                onPress={() => handlePurchase(offer, item.id)}
              >
                {purchasingId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Buy</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { marginTop: 8, backgroundColor: hasAccess ? 'green' : 'red'}]}
                onPress={() => iapServiceInstance?.checkFeatureAccess( item.id)}
              >
                <Text style={styles.buttonText}>
                  Access: {hasAccess ? 'Granted' : 'Locked'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

/**
 * Main App component
 */
function App(): React.JSX.Element {
  const [appState, setAppState] = useState(initialAppState);
  const [showSubs, setShowSubs] = useState(false);

  // Instantiate singletons once
  const appStateManager = useRef<AppStateManager>(
    appStateManagerInstance || (appStateManagerInstance = new AppStateManager([appState, setAppState]))
  ).current;

  const iapService = useRef<AppService>(
    iapServiceInstance || (iapServiceInstance = new AppService(appStateManager))
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

  // SubscriptionScreen styles
  screenContainer: { flex: 1, paddingTop: 40 },
  backButton: { padding: 12 },
  backText: { fontSize: 16, color: '#007AFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, marginVertical: 4 },
  detail: { fontSize: 14, color: '#666', marginBottom: 12 },
});

export default App;
