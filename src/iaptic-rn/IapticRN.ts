import { getReceiptIOS, ProductPurchase } from "react-native-iap";
import { Alert, Platform } from "react-native";
import { IapticConfig, IapticErrorCode, IapticProduct, IapticVerifiedPurchase, IapticOffer, IapticLoggerVerbosityLevel } from "./types";
import * as IAP from 'react-native-iap';
import { StoreProducts } from "./classes/StoreProducts";
import { Purchases } from "./classes/Purchases";
import { Subscriptions } from "./classes/Subscriptions";
import { validateReceipt } from "./functions/validateReceipt";
import { IapticError, IapticErrorSeverity, toIapticError } from "./classes/IapticError";
import { Utils } from "./classes/Utils";
import { PendingPurchases } from "./classes/PendingPurchases";
import { logger } from "./classes/IapticLogger";
import { isUUID, md5UUID } from "./functions/md5UUID";
import { IapticEvents } from './classes/IapticEvents';
import { IapticEventType, IapticEventListener } from './types';
import { NonConsumables } from "./classes/NonConsumables";
import { Consumables } from "./classes/Consumables";
import { Locales } from "./classes/Locales";
import { IapEventsProcessor } from "./classes/IapEventsProcessor";

/** Main class for handling in-app purchases with iaptic */
export class IapticRN {

  /** Configuration for the iaptic service */
  readonly config: IapticConfig;

  /** Manages user-side event listeners */
  private events: IapticEvents = new IapticEvents();

  /** Product catalog containing all available products */
  readonly products: StoreProducts = new StoreProducts([], [], []);
  /** Manages all verified purchases */
  readonly purchases: Purchases = new Purchases(this.events);
  /** Manages subscription-specific functionality */
  readonly subscriptions: Subscriptions = new Subscriptions(this.purchases, this.products, this.events);
  /** Manages non-consumable purchases */
  readonly nonConsumables: NonConsumables = new NonConsumables(this.purchases, this.products, this.events);
  /** Manages consumable purchases */
  readonly consumables: Consumables = new Consumables(this.purchases, this.products, this.events);
  /** Manages pending purchases */
  readonly pendingPurchases: PendingPurchases = new PendingPurchases(this.events);

  /** Utility functions */
  readonly utils: Utils = new Utils();

  /** Process events from react-native-iap plugin */
  private iapEventsProcessor = new IapEventsProcessor(this, this.events);

  /** Flag to check if the initialize() method has been called and succeeded */
  private initialized = false;

  /** The application username */
  private applicationUsername: string | undefined;

  /**
   * Creates a new instance of IapticRN
   * @param config - Configuration for the iaptic service
   */
  constructor(config: IapticConfig) {
    this.config = config;
    if (!this.config.baseUrl) {
      this.config.baseUrl = 'https://validator.iaptic.com';
    }
    if (this.config.showAlerts === undefined) {
      this.config.showAlerts = true;
    }
  }

  /** Set the application username */
  setApplicationUsername(applicationUsername: string) {
    this.applicationUsername = applicationUsername;
  }

  /**
   * Initializes the iaptic plugin
   */
  async initialize() {
    if (this.initialized) return;
    logger.info('initialize');
    this.initialized = true;
    try {
      await IAP.initConnection();
      this.iapEventsProcessor.addListeners();
      return null;
    } catch (err: any) {
      this.initialized = false;
      logger.error(`❌ Failed to initialize IAP #${err.code}: ${err.message}`);
      throw toIapticError(err, IapticErrorSeverity.WARNING, IapticErrorCode.SETUP, 'Failed to initialize the in-app purchase library, check your configuration.');
    }
  }

  /**
   * Set iaptic plugin's verbosity level
   * @param verbosity 
   */
  setVerbosity(verbosity: IapticLoggerVerbosityLevel) {
    logger.verbosity = verbosity;
  }

  /**
   * Destroys the iaptic service
   */
  destroy() {
    logger.info('destroy');
    this.iapEventsProcessor.removeListeners();
    this.events.removeAllEventListeners();
  }

  /**
   * Check if a product can be purchased.
   * 
   * @param product - The product to check
   * @returns True if the product can be purchased, false otherwise
   */
  canPurchase(product: IapticProduct): boolean {
    return !this.owned(product.id) && !this.pendingPurchases.has(product.id);
  }

  /**
   * Check if a product is owned.
   * 
   * @param productId - The product identifier
   * @returns True if the product is owned, false otherwise
   */
  owned(productId: string): boolean {
    const purchase = this.purchases.getPurchase(productId);
    if (!purchase) return false;
    if (purchase.isExpired) return false;
    if (purchase.cancelationReason) return false;
    if (purchase.expiryDate && new Date(purchase.expiryDate) < new Date()) return false;
    return true;
  }

  /**
   * Add the application username to a purchase request
   * 
   * On iOS, the application username is added as an appAccountToken in the form of a UUID.
   * On Android, the application username is added as an obfuscatedAccountIdAndroid in the form of a 64 characters string.
   * 
   * @param request - The request to add the application username to
   * @returns The request with the application username added
   */
  private addApplicationUsernameToRequest<T extends IAP.RequestPurchase | IAP.RequestSubscription>(request: T): T {
    if (!this.applicationUsername) return request;
    if (Platform.OS === 'ios') {
      if (isUUID(this.applicationUsername)) {
        (request as IAP.RequestPurchaseIOS).appAccountToken = this.applicationUsername;
      } else {
        (request as IAP.RequestPurchaseIOS).appAccountToken = md5UUID(this.applicationUsername);
      }
    } else {
      (request as IAP.RequestPurchaseAndroid).obfuscatedAccountIdAndroid = this.applicationUsername.slice(0, 64); // max 64 characters
    }
    return request;
  }

  /**
   * Order a product with an offer.
   * 
   * @param offer - The offer to order
   */
  async order(offer: IapticOffer) {
    logger.info(`order: ${offer.productId}/${offer.id} applicationUsername:${this.applicationUsername}`);
    try {
      this.pendingPurchases.add(offer);
      switch (this.products.getType(offer.productId)) {
        case 'non consumable':
        case 'consumable':
          await IAP.requestPurchase(this.addApplicationUsernameToRequest({
            sku: offer.productId,
          }));
          break;
        case 'paid subscription':
          if (offer.platform === 'android' && offer.offerToken) {
            await IAP.requestSubscription(this.addApplicationUsernameToRequest({
              sku: offer.productId,
              subscriptionOffers: [{
                sku: offer.productId,
                offerToken: offer.offerToken!
              }]
            }));
          } else {
            await IAP.requestSubscription(this.addApplicationUsernameToRequest({ sku: offer.productId }));
          }
          break;
      }
      this.pendingPurchases.update(offer.productId, 'processing');
    }
    catch (err: any) {
      this.pendingPurchases.remove(offer.productId);
      throw toIapticError(err,
        (err.code === 'E_USER_CANCELLED') ? IapticErrorSeverity.INFO : IapticErrorSeverity.ERROR,
        IapticErrorCode.PURCHASE,
        'Failed to place a purchase. Offer: ' + JSON.stringify(offer));
    }
  }

  /**
   * Validate and register a purchase with iaptic receipt validator.
   * 
   * @param purchase - The purchase to validate
   * @param productType - The type of the product
   * @param applicationUsername - The username of the application
   * @returns The validated purchase or undefined if the purchase is not valid
   */
  async validatePurchase(purchase: ProductPurchase): Promise<IapticVerifiedPurchase | undefined> {
    const productType = this.products.getType(purchase.productId);
    console.log('🔄 Validating purchase:', purchase, 'productType:', productType, 'applicationUsername:', this.applicationUsername);
    if (!purchase.transactionId) {
      throw new Error('Transaction ID is required');
    }

    let receipt: string | undefined | null = purchase.transactionReceipt;
    if (!receipt && Platform.OS === 'ios' && !IAP.isIosStorekit2()) {
      receipt = await getReceiptIOS({ forceRefresh: true });
    }

    const result = await validateReceipt({
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      receipt: receipt || '',
      receiptSignature: purchase.signatureAndroid || '',
      productType,
      applicationUsername: this.applicationUsername,
    }, this.products.list(), this.config);
    if (result.ok) {
      if (result.data.collection) {
        result.data.collection.forEach(purchase => this.purchases.addPurchase(purchase));
      }
      return result.data.collection?.find(vPurchase => vPurchase.id === purchase.productId);
    }
    else {
      const code = result.code ?? IapticErrorCode.UNKNOWN;
      const message = result.message ?? 'Failed to validate purchase';
      throw new IapticError(message, {
        severity: IapticErrorSeverity.WARNING,
        code,
        localizedTitle: Locales.get('ValidationError'),
        localizedMessage: Locales.get(`IapticError_${code}`),
        debugMessage: message,
      });
    }
  }

  /// High level functions
  async loadPurchases(): Promise<IapticVerifiedPurchase[]> {
    if (Platform.OS === 'ios' && !IAP.isIosStorekit2()) {
      return this.getVerifiedPurchasesStorekit1(this.applicationUsername);
    }
    const purchases = await IAP.getAvailablePurchases();
    const results = await Promise.all(purchases.map(p => this.validatePurchase(p)));
    return results.filter(r => r !== undefined);
  }

  private async getVerifiedPurchasesStorekit1(applicationUsername?: string): Promise<IapticVerifiedPurchase[]> {
    const receipt = await IAP.getReceiptIOS({ forceRefresh: false });
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    if (!this.config.iosBundleId) {
      throw new Error('iOS bundle ID is not set');
    }
    const bundleId = this.config.iosBundleId;
    const result = await validateReceipt({
      productId: bundleId,
      transactionId: bundleId,
      receipt: receipt,
      productType: 'application',
      applicationUsername,
      receiptSignature: '',
    }, this.products.list(), this.config);
    if (result.ok) {
      if (result.data.collection) {
        result.data.collection.forEach(purchase => this.purchases.addPurchase(purchase));
      }
      return result.data.collection ?? [];
    }
    else {
      throw new IapticError(result.message ?? 'Failed to validate purchase', {
        severity: IapticErrorSeverity.WARNING,
        code: result.code ?? IapticErrorCode.UNKNOWN,
        status: result.status,
        localizedTitle: Locales.get('ValidationError'),
        localizedMessage: Locales.get(`IapticError_${result.code ?? IapticErrorCode.UNKNOWN}`),
        debugMessage: 'A receipt validation call failed with status ' + result.status,
      });
    }
  }

  /**
   * Check if the user owns any product that provides the specified entitlement.
   * 
   * @param featureId - The entitlement to check
   * @returns True if the user owns any product that provides the specified entitlement, false otherwise
   */
  checkEntitlement(featureId: string): boolean {
    for (const purchase of this.purchases.list()) {
      if (this.owned(purchase.id)) {
        const definition = this.products.getDefinition(purchase.id);
        if (definition?.entitlements?.some(e => e === featureId)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * List all entitlements the user owns.
   * 
   * @returns A list of all entitlements the user owns
   */
  listEntitlements(): string[] {
    const entitlements = new Set<string>();
    for (const purchase of this.purchases.list()) {
      const definition = this.products.getDefinition(purchase.id);
      if (definition?.entitlements) {
        definition.entitlements.forEach(e => entitlements.add(e));
      }
    }
    return Array.from(entitlements);
  }

  /**
   * Add an event listener for iaptic events
   * 
   * @param eventType - Type of event to listen for
   * @param listener - Callback function that will be called when the event occurs
   * 
   * @example
   * ```typescript
   * // Listen for subscription updates
   * iaptic.addEventListener('subscription.updated', (reason, purchase) => {
   *   console.log(`Subscription ${purchase.id} ${reason}`);
   * });
   * 
   * // Listen for pending purchase updates
   * iaptic.addEventListener('pendingPurchase.updated', (pendingPurchase) => {
   *   console.log(`Purchase ${pendingPurchase.productId} is now ${pendingPurchase.status}`);
   * });
   * 
   * // Listen for purchase updates
   * iaptic.addEventListener('purchase.updated', (purchase) => {
   *   console.log(`Purchase ${purchase.id} ${purchase.status}`);
   * });
   * 
   * // Listen for non-consumable purchases
   * iaptic.addEventListener('nonConsumable.owned', (purchase) => {
   *   console.log(`Non-consumable purchase ${purchase.id} is now owned`);
   * });
   * ```
   */
  addEventListener<T extends IapticEventType>(
    eventType: T,
    listener: IapticEventListener<T>
  ) {
    return this.events.addEventListener(eventType, listener);
  }

  /**
   * Remove all event listeners for a specific event type
   * If no event type is specified, removes all listeners for all events
   * 
   * @param eventType - Optional event type to remove listeners for
   */
  removeAllEventListeners(eventType?: IapticEventType): void {
    this.events.removeAllEventListeners(eventType);
  }

  /**
   * Function used in developement to cleanup the cache of pending transactions.
   */
  async flushTransactions() {
    if (Platform.OS === 'android') {
      // On Android, try to flush failed purchases as a recovery mechanism
      try {
        await IAP.flushFailedPurchasesCachedAsPendingAndroid();
      }
      catch (e: any) {
        return toIapticError(e, IapticErrorSeverity.ERROR);
      }
    }
  }

  async restorePurchases(progressCallback: (processed: number, total: number) => void) {
    try {
      progressCallback(-1, 0);
      const purchases = await IAP.getAvailablePurchases();
      logger.info('📦 Checking for any pending purchases:' + purchases.length);

      if (purchases.length === 0) {
        Alert.alert('No purchases to restore.');
        return;
      }

      progressCallback(0, purchases.length);
      for (let i = 0; i < purchases.length; i++) {
        await this.iapEventsProcessor.processPurchase(purchases[i]);
        progressCallback(i + 1, purchases.length);
      }
    } catch (error: any) {
      throw toIapticError(error, IapticErrorSeverity.ERROR);
    }
  }

  /**
   * Consume a purchase
   * 
   * @param purchase - The purchase to consume
   */
  consume(purchase: IapticVerifiedPurchase) {
    const nativePurchase = this.iapEventsProcessor.purchases.get(purchase.transactionId ?? purchase.id);
    if (nativePurchase) {
      IAP.finishTransaction({
        purchase: nativePurchase,
        isConsumable: this.products.getType(purchase.id) === 'consumable'
      });
    }
  }
}
