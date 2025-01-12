import * as IAP from 'react-native-iap';

/**
 * The state of the app
 */
export interface AppState {

  /** List of products available for purchase */
  availableProducts: IAP.Product[];

  /** The number of tokens the user has */
  tokens: number;

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
  availableProducts: [],
  tokens: 0,
  purchaseInProgress: undefined,
  restorePurchasesInProgress: undefined,
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
  setPurchaseStatus(status: 'purchasing' | 'processing' |  'validating' | 'finishing', productId: string) {
    this.set({ purchaseInProgress: { productId, status } });
  }

  /**
   * Clear the purchase status
   */
  clearPurchaseStatus() {
    this.set({ purchaseInProgress: undefined });
  }

  setTokens(tokens: number) {
    this.set({ tokens });
  }

  setRestorePurchasesTotal(total: number) {
    this.set({ restorePurchasesInProgress: { numDone: 0, total } });
  }

  setRestorePurchasesProgress(numDone: number) {
    if (numDone >= (this._state?.restorePurchasesInProgress?.total ?? 0)) {
      this.set({ restorePurchasesInProgress: undefined });
    } else {
      this.set({ restorePurchasesInProgress: { numDone, total: this._state.restorePurchasesInProgress?.total ?? 0 } });
    }
  }

  /**
   * Get the app state
   */
  get() { 
    return this.appState;
  }
}