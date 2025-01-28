import * as IAP from 'react-native-iap';
import { IapticEvents } from './IapticEvents';
import { IapticRN } from '../IapticRN';
import { DebouncedProcessor } from './DebouncedProcessor';
import { IapticErrorSeverity, toIapticError } from './IapticError';
import { EmitterSubscription } from 'react-native';

/**
 * Process events from react-native-iap
 */
export class IapEventsProcessor {

    private purchaseProcessor = new DebouncedProcessor<IAP.SubscriptionPurchase | IAP.ProductPurchase>(p => this.processPurchase(p, true), p => p.transactionId ?? '');
    private errorProcessor = new DebouncedProcessor<IAP.PurchaseError>(e => this.processError(e), e => e.code ?? '');
  
    private onPurchaseUpdate?: EmitterSubscription;
    private onPurchaseError?: EmitterSubscription;
  
    purchases: Map<string, IAP.ProductPurchase | IAP.SubscriptionPurchase> = new Map();
  
    constructor(private readonly iaptic: IapticRN, private readonly events: IapticEvents) {
    }
  
    addListeners() {
      if (this.onPurchaseUpdate) return;
      this.onPurchaseUpdate = IAP.purchaseUpdatedListener(p => this.purchaseProcessor.add(p));
      this.onPurchaseError = IAP.purchaseErrorListener(e => this.errorProcessor.add(e));
    }
  
    removeListeners() {
      this.onPurchaseUpdate?.remove();
      this.onPurchaseError?.remove();
      this.onPurchaseUpdate = this.onPurchaseError = undefined;
    }
  
    /**
     * - Triggers in real-time when a new purchase is made
     * - Only catches purchases that happen while the app is running
     * - Is the primary way to handle active purchase flows
     * - Won't catch purchases made on other devices or in previous installations
     */
    async processPurchase(purchase: IAP.SubscriptionPurchase | IAP.ProductPurchase, inBackground: boolean = false) {
  
      // Cache the purchase for 1 minute (so we can finish it later)
      this.purchases.set(purchase.transactionId ?? purchase.productId, purchase);
      setTimeout(() => {
        this.purchases.delete(purchase.transactionId ?? purchase.productId);
      }, 60000); // remove from cache after 1 minute
  
      const reportError = (err: any, severity: IapticErrorSeverity = IapticErrorSeverity.WARNING) => {
        if (inBackground) {
          this.events.emit('error', toIapticError(err, severity));
        }
        else {
          throw toIapticError(err, severity);
        }
      }
  
      // First validate the purchase with iaptic
      try {
        const verified = await this.iaptic.validatePurchase(purchase);
        if (!verified) {
            // the receipt is valid, but transaction does not exist, let's finish it
            IAP.finishTransaction({ purchase, isConsumable: this.iaptic.products.getType(purchase.productId) === 'consumable' });
        }
      }
      catch (error: any) {
        reportError(error, IapticErrorSeverity.WARNING);
        return;
      }
  
      // Let's handle subscriptions
      switch (this.iaptic.products.getType(purchase.productId)) {
        case 'consumable':
          // We let the user consume the purchase
          break;
        case 'non consumable':
        case 'paid subscription':
          // Automatically finish the purchase for non-consumable and paid subscriptions
          // because iaptic has the status now
          try {
            this.iaptic.pendingPurchases.update(purchase.productId, 'finishing');
            await IAP.finishTransaction({ purchase, isConsumable: this.iaptic.products.getType(purchase.productId) === 'consumable' });
          } catch (finishError: any) {
            reportError(finishError, IapticErrorSeverity.WARNING);
          }
          break;
      }
  
      this.iaptic.pendingPurchases.update(purchase.productId, 'completed');
    }
  
    private processError(error: IAP.PurchaseError) {
      // TODO: bubble up the error.
    }
  }