import { Platform, Alert, ToastAndroid } from 'react-native';
import { IapticError, IapticErrorSeverity, IapticOffer, IapticRN } from './iaptic-rn';
import { AppStateManager } from './AppState';
import { Config } from './Config';

export class IapService {

  log(message: string) {
    console.log(`${new Date().toISOString()} ${message}`);
  }

  /** Stateful app state returned by useState */
  private appState: AppStateManager;

  /** The subscription manager
  private subscriptionManager: SubscriptionManager = new SubscriptionManager(); */

  /** The iaptic library */
  private iaptic: IapticRN = new IapticRN(Config.iaptic);

  constructor(appState: AppStateManager) {
    this.appState = appState;
  }

  /**
   * Called when the app starts up.
   * 
   * @returns a destructor function that should be called when the app is closed
   */
  onAppStartup() {

    this.log('onAppStartup');
    this.setupIapListeners();
    const initIap = async () => {
      try {
        await this.iaptic.initialize();
        this.iaptic.setApplicationUsername(this.appState.get().applicationUsername);
        const availableProducts = await this.iaptic.products.load(Config.products);
        this.appState.set({ availableProducts });
        await this.iaptic.loadPurchases();
        this.appState.set({ activeSubscription: this.iaptic.subscriptions.active() });
      }
      catch (err: any) {
        this.showError(err);
      }
    }

    initIap();
    const onAppCleanup = () => {
      this.iaptic.removeAllEventListeners();
    }

    return onAppCleanup;
  }

  /**
   * Show an error to the user
   */
  showError(error: Error | IapticError) {
    if (error instanceof IapticError) {

      switch (error.severity) {
        case IapticErrorSeverity.ERROR:
          Alert.alert(error.localizedTitle, error.localizedMessage);
          break;

        case IapticErrorSeverity.WARNING:
          if (Platform.OS === 'android') {
            ToastAndroid.show(error.localizedMessage, ToastAndroid.SHORT);
          }
          else {
              Alert.alert(error.localizedTitle, error.localizedMessage);
          }
        break;

        case IapticErrorSeverity.INFO:
          this.log('🔔 Informational error in IAP:' + error.message);
          break;
      }
    }
    else {
      Alert.alert('Error', error.message);
    }
  }

  /**
   * Called when the user presses the subscribe button for a given subscription product
   */
  async handleSubscribeButton(offer: IapticOffer) {
    try {
      await this.iaptic.order(offer);
    }
    catch (err: any) {
      this.showError(err);
    }
  }

  /**
   * Creates the listeners for the in-app purchase events
   */
  private setupIapListeners() {

    this.iaptic.addEventListener('pendingPurchase.updated', purchase => {
      this.appState.setPurchaseStatus(purchase.status, purchase.productId);
    });

    this.iaptic.addEventListener('subscription.updated', (reason, purchase) => {
      this.log('🔄 Subscription updated: ' + reason + ' for ' + purchase.id);
      this.appState.set({ activeSubscription: this.iaptic.subscriptions.active() });
    });

    this.log('✅ Listeners registered');
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
      await this.iaptic.restorePurchases((processed, total) => {
        this.appState.setRestorePurchasesProgress(processed, total);
      });
    } catch (error: any) {
      this.showError(error);
    }
  }
}
