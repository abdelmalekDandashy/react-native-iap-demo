/**
 * The state of the app
 */
export interface AppState {

  /** Pseudo-identifier of the user logged in the app, for demo purposes */
  applicationUsername: string;

  /** Entitlements of the user */
  entitlements: string[];
}

/**
 * The initial state of the app
 */
export const initialAppState: AppState = {
  applicationUsername: 'UseUserIdforTapynHere',
  entitlements: [],
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
    console.log('AppStateManager constructor');
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
    this.appState = this._state;
    this.setAppState(this._state);
  }

  /**
   * Get the app state
   */
  getState() {
    return this._state;
  }
}