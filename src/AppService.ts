import { Platform, Alert, ToastAndroid } from 'react-native';
import { IapticError, IapticSeverity, IapticOffer, IapticRN } from 'react-native-iaptic';
import { AppStateManager } from './AppState';
import { Config } from './Config';

export class AppService {

  log(message: string, severity: IapticSeverity = IapticSeverity.INFO) {
    const SYMBOLS = ['💡', '🔔', '❌'];
    console.log(`${new Date().toISOString()} ${SYMBOLS[severity]} ${message}`);
  }

  /** Stateful app state returned by useState */
  private appState: AppStateManager;

  constructor(appState: AppStateManager) {
    this.appState = appState;
  }

  /**
   * Called when the app starts up.
   * 
   * @returns a destructor function that should be called when the app is closed
   */
  async onAppStartup() {
    this.log('onAppStartup');
    await this.initializeIaptic();
    return () => {
      IapticRN.destroy();
    }
  }

  async initializeIaptic() {
    try {
      IapticRN.addEventListener('subscription.updated', (reason, purchase) => {
        this.log('🔄 Subscription updated: ' + reason + ' for ' + JSON.stringify(purchase));
        this.appState.set({ entitlements: IapticRN.listEntitlements() });
      });

      await IapticRN.initialize(Config.iaptic);
      IapticRN.setApplicationUsername(this.appState.getState().applicationUsername);
  
      this.appState.set({
        entitlements: IapticRN.listEntitlements(),
      });
    }
    catch (err: any) {
      if (err instanceof IapticError) {
        Alert.alert(err.localizedTitle, err.localizedMessage);
      }
    }
  }

  /**
   * Show an error to the user
   */
  showError(error: Error | IapticError) {
  }

  handlePurchaseComplete() {
    Alert.alert('Thank you for your purchase');
    console.log(IapticRN.listEntitlements());
    console.log(IapticRN.getActiveSubscription());
  }

  /**
   * Check if a feature is unlocked
   * 
   * @param featureId - The feature ID to check
   */
  public checkFeatureAccess(featureId: string) {
    if (IapticRN.checkEntitlement(featureId)) {
      Alert.alert(`"${featureId}" feature is unlocked.`);
    }
    else {
      Alert.alert(`Please subscribe to the app to unlock feature "${featureId}".`);
    }
  }
}

