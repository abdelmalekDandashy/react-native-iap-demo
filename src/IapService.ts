import { Platform, Alert, EmitterSubscription } from 'react-native';
import * as IAP from 'react-native-iap';
import { TokenManager } from './TokenManager';
import { IapticRN } from './iaptic-rn';
import { ProductPurchase, SubscriptionPurchase } from 'react-native-iap';
import { AppStateManager } from './AppState';
import { IapProducts } from './IapProducts';
import { DebouncedProcessor } from './DebouncedProcessor';
import { Config } from './Config';

export class IapService {

  private UUID: string = randomID();
  log(message: string) {
    console.log(`[${this.UUID}] ${message}`);
  }

  /** Stateful app state returned by useState */
  private appState: AppStateManager;

  /** The token manager */
  private tokenManager: TokenManager = new TokenManager();

  private iaptic: IapticRN = new IapticRN(Config.iaptic);

  private purchaseProcessor = new DebouncedProcessor<SubscriptionPurchase | ProductPurchase>(p => this.processPurchase(p), p => p.transactionId ?? '');
  private errorProcessor = new DebouncedProcessor<IAP.PurchaseError>(e => this.processError(e), e => e.code ?? '');

  constructor(appState: AppStateManager) {
    this.appState = appState;
  }

  /**
   * Called when the app starts up.
   * @returns a destructor function that should be called when the app is closed
   */
  onAppStartup() {

    this.log('onAppStartup');
    const listeners = this.setupIapListeners();
    const initIap = async () => {
      try {
        await this.initConnection();
        await this.loadAvailableProducts();
        // await this.restorePurchases();
      }
      catch (err: any) {
        Alert.alert('Error', err.message);
      }
    }
    initIap();
    const onAppCleanup = () => {
      this.log('onAppCleanup');
      listeners.remove();
    }
    return onAppCleanup;
  }

  /**
   * Called when the user presses the purchase button for a given product
   */
  async handlePurchaseButton(product: IAP.Product) {
    try {
      this.appState.setPurchaseStatus('purchasing', product.productId);
      await IAP.requestPurchase({ sku: product.productId });
      this.appState.setPurchaseStatus('processing', product.productId);
    }
    catch (err: any) {
      this.appState.clearPurchaseStatus();
      if (err.code === 'E_USER_CANCELLED') return; // User closed the purchase dialog
      Alert.alert('Error #' + err.code, err.message);
    }
  }

  /**
   * Creates the listeners for the in-app purchase events
   */
  private setupIapListeners() {
    /**
      * purchaseUpdatedListener:
      * - Triggers in real-time when a new purchase is made
      * - Only catches purchases that happen while the app is running
      * - Is the primary way to handle active purchase flows
      * - Won't catch purchases made on other devices or in previous installations
      */
    const onPurchaseUpdate = IAP.purchaseUpdatedListener(
      async (purchase: SubscriptionPurchase | ProductPurchase) =>
        this.purchaseProcessor.add(purchase));

    const onPurchaseError = IAP.purchaseErrorListener(
      async (error: IAP.PurchaseError) =>
        this.errorProcessor.add(error));

    this.log('✅ Listeners registered');

    return {
      remove() {
        onPurchaseUpdate.remove();
        onPurchaseError.remove();
      }
    }
  }

  private async initConnection() {
    try {
      await IAP.initConnection();
    } catch (err: any) {
      console.error('❌ Failed to initialize IAP:', err);
      throw new Error(`Impossible to initialize the in-app purchases: ${err.message}`);
    }
  }

  private async loadAvailableProducts() {
    try {
      this.log('🔄 Loading available products');
      const availableProducts = await IAP.getProducts({
        skus: IapProducts.getProductIds()
      });
      this.log('🔄 Available products:' + JSON.stringify(availableProducts, null, 2));
      this.appState.set({ availableProducts });
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      throw new Error(`Impossible to fetch the products: ${error.message}`);
    }

    if (Platform.OS === 'android') {
      await IAP.flushFailedPurchasesCachedAsPendingAndroid();
    }
  }

  /**
   * - Process the historical record of valid purchases
   * - Useful for restoring purchases when:
   *   - User reinstalls the app
   *   - User switches devices
   *   - App starts fresh (no local storage)
   *   - Purchase succeeded but app crashed before purchaseUpdatedListener could process it
   *   - Any interruption during purchase flow (network issues, app crash, device shutdown)
   * - Acts as a safety net to ensure no purchases are lost
   */
  public async restorePurchases() {
    try {
      this.appState.setRestorePurchasesTotal(0);
      const purchases = await IAP.getAvailablePurchases();
      this.log('📦 Checking for any pending purchases:' + purchases.length);

      this.appState.setRestorePurchasesTotal(purchases.length);
      for (let i = 0; i < purchases.length; i++) {
        await this.processPurchase(purchases[i]);
        this.appState.setRestorePurchasesProgress(i + 1);
      }

    } catch (error) {
      console.error('❌ Error checking pending purchases:', error);
      throw error;
    }
  }

  /** Function used in developement to cleanup the cache of pending transactions */
  private async handleFlushTransactions() {
    if (Platform.OS === 'android') {
      // On Android, try to flush failed purchases as a recovery mechanism
      try {
        await IAP.flushFailedPurchasesCachedAsPendingAndroid();
        console.log('Successfully flushed pending purchases on Android');
      } catch (flushError) {
        console.error('Error flushing pending purchases:', flushError);
      }
    }
  }

  private processError(error: IAP.PurchaseError) {
    if (error.code === 'E_USER_CANCELLED') return; // User closed the purchase dialog
    this.log('❌ Purchase error details:');
    this.log(`  code: ${error.code}`);
    this.log(`  message: ${error.message}`);
    this.log(`  debugMessage: ${error.debugMessage}`);
    this.log(`  productId: ${error.productId}`);
    this.log(`  responseCode: ${error.responseCode}`);
    // Log any other available properties
    this.log(`  fullError: ${error}`);
  }

  /**
   * Process a purchase
   * 
   * @param purchase The purchase to process
   */
  private async processPurchase(purchase: ProductPurchase | SubscriptionPurchase) {
    this.log('🟢 Processing purchase');
    this.log(`  productId: ${purchase.productId}`);
    this.log(`  transactionId: ${purchase.transactionId}`);
    this.log(`  receipt: ${purchase.transactionReceipt?.substring(0, 50) + '...'}`);
    try {
      if (IapProducts.numTokens(purchase.productId) > 0 && purchase.transactionId) {
        await this.processTokensPurchase(purchase, purchase.transactionId, IapProducts.numTokens(purchase.productId));
      }
      this.appState.setPurchaseStatus('finishing', purchase.productId);

      try {
        await IAP.finishTransaction({ purchase, isConsumable: IapProducts.isConsumable(purchase.productId) });
        this.log("finishTransaction done");
        Alert.alert('Success', `You now have ${this.tokenManager.getBalance()} tokens!`);
      } catch (finishError: any) {

        console.error('Error finishing transaction:', {
          code: finishError.code,
          message: finishError.message,
          purchase: { productId: purchase.productId, transactionId: purchase.transactionId },
        });

        // Even if finishing fails, the purchase was validated, so we keep the tokens
        Alert.alert('Purchase Successful',
          `You have received your tokens, but there was a minor technical issue. ` +
          `You now have ${this.tokenManager.getBalance()} tokens!`);
      }

      this.appState.clearPurchaseStatus();
    } catch (error) {
      this.log('❌ Error handling purchase');
      Alert.alert('Error', 'An error occurred while processing purchase');
    }
  }

  private async processTokensPurchase(purchase: ProductPurchase | SubscriptionPurchase, transactionId: string, numTokens: number) {
    if (!purchase.transactionId) return;
    if (!purchase.transactionReceipt) return;
    try {
      this.log("Validate with iaptic.");
      this.appState.setPurchaseStatus('validating', purchase.productId);
      const verifiedPurchase = await this.iaptic.validatePurchase(purchase, 'consumable', 'user_id');

      if (verifiedPurchase) {
        // Process the purchase in the app (token manager)
        this.log('🔄 Processing validated purchase:' + purchase.transactionId);
        if (verifiedPurchase.cancelationReason)
          this.tokenManager.removeTransaction(transactionId);
        else
          this.tokenManager.addTransaction(transactionId, IapProducts.numTokens(purchase.productId));
        this.appState.setTokens(this.tokenManager.getBalance());
      } else {
        console.error('Invalid receipt:', verifiedPurchase);
        Alert.alert('Error', 'Purchase validation failed');
      }
    } catch (error: any) {

      console.error('Validation error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
      });

      Alert.alert('Purchase Validation Failed', error?.message ?? 'Failed to validate purchase');
    }
  }

}

function randomID(): string {
  return Math.random().toString(36).substring(2, 15);
}
