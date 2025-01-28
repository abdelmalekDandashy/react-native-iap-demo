import { IapticProduct, IapticVerifiedPurchase } from './iaptic-rn';

/**
 * The state of the app
 */
export interface AppState {

  /** Pseudo-identifier of the user logged in the app, for demo purposes */
  applicationUsername: string;

  /** List of products available for purchase */
  availableProducts: IapticProduct[];

  /** The active subscription */
  activeSubscription?: IapticVerifiedPurchase;

  /** Progress of restoring purchases */
  restorePurchasesInProgress?: {
    numDone: number;
    total: number;
  };

  /** Information about the purchase in progress */
  purchaseInProgress?: {
    productId: string;
    status: 'purchasing' | 'processing' |  'validating' | 'finishing';
  };
}

/**
 * The initial state of the app
 */
export const initialAppState: AppState = {
  applicationUsername: 'iaptic-rn-demo-user',
  availableProducts: [],
  purchaseInProgress: undefined,
  restorePurchasesInProgress: undefined,
  activeSubscription: undefined,
}

/**
 * Manages the app state
 */
export class AppStateManager {

  private _state: AppState;

  /** The app state */
  private appState: AppState;

  /** The function to update the app state */
  private setAppState: (appState: AppState) => void;

  constructor([appState, setAppState]: [AppState, (appState: AppState) => void]) {
    this._state = {...appState};
    this.appState = appState;
    this.setAppState = setAppState;
  }

  /**
   * Update part of the app state
   * 
   * @param value - Fields to update
   */
  set(value: Partial<AppState>) {
    this._state = { ...this._state, ...value };
    this.setAppState(this._state);
  }

  /**
   * Set the purchase status
   */
  setPurchaseStatus(status: 'purchasing' | 'processing' |  'validating' | 'finishing' | 'completed', productId: string) {
    if (status === 'completed') {
      this.clearPurchaseStatus();
    } else {
      this.set({ purchaseInProgress: { productId, status } });
    }
  }

  /**
   * Clear the purchase status
   */
  clearPurchaseStatus() {
    this.set({ purchaseInProgress: undefined });
  }

  setRestorePurchasesProgress(numDone: number, total: number) {
    if (numDone >= total) {
      this.set({ restorePurchasesInProgress: undefined });
    } else {
      this.set({ restorePurchasesInProgress: { numDone, total } });
    }
  }

  /**
   * Get the app state
   */
  get() { 
    return this.appState;
  }
}