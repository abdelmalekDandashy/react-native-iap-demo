import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { IapticRN, IapticProduct, IapticOffer } from 'react-native-iaptic';
import { singletons } from './singletons';

export function SubscriptionScreen({ onClose }: { onClose: () => void }) {
  const [subscriptions, setSubscriptions] = useState<IapticProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const myUserId = 'user_12345';
        await IapticRN.setApplicationUsername(myUserId);
        const all = IapticRN.getProducts();
        const subs = all.filter(p => p.type === 'paid subscription' || 'consumable');
        setSubscriptions(subs);
      } catch (err) {
        console.warn('Error loading subscription products:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = async (offer: IapticOffer, productId: string) => {
    try {
      setPurchasingId(productId);
      await IapticRN.order(offer);
      singletons.iapServiceInstance?.handlePurchaseComplete();
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
            singletons.appStateManagerInstance?.getState().entitlements.includes(e),
          );

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>{offer.localizedPrice || offer.pricingPhases[0].price}</Text>
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
                style={[styles.button, { marginTop: 8, backgroundColor: hasAccess ? 'green' : 'red' }]}
                onPress={() =>
                { singletons.iapServiceInstance?.checkFeatureAccess(entitlements[0] || item.id);
                  console.log('it,.id', entitlements[0] || item.id);
                 }
                }
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

const styles = StyleSheet.create({
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
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

