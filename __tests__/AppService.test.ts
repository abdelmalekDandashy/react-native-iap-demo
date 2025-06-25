import { Alert } from 'react-native';
import { AppService } from '../src/AppService';
import { AppStateManager } from '../src/AppState';
import { IapticRN } from 'react-native-iaptic';

describe('AppService checkFeatureAccess', () => {
  let service: AppService;

  beforeEach(() => {
    const state = { applicationUsername: 'test', entitlements: [] };
    const manager = new AppStateManager([state, jest.fn()]);
    service = new AppService(manager);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('alerts unlocked message when entitlement present', () => {
    (IapticRN.checkEntitlement as jest.Mock).mockReturnValue(true);
    service.checkFeatureAccess('feat');
    expect(IapticRN.checkEntitlement).toHaveBeenCalledWith('feat');
    expect(Alert.alert).toHaveBeenCalledWith('"feat" feature is unlocked.');
  });

  it('alerts subscription prompt when locked', () => {
    (IapticRN.checkEntitlement as jest.Mock).mockReturnValue(false);
    service.checkFeatureAccess('feat');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Please subscribe to the app to unlock feature "feat".'
    );
  });
});
