import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-iaptic', () => {
  return {
    IapticRN: {
      addEventListener: jest.fn(),
      initialize: jest.fn(),
      setApplicationUsername: jest.fn(),
      loadProducts: jest.fn(),
      getProducts: jest.fn().mockReturnValue([]),
      order: jest.fn(),
      listEntitlements: jest.fn().mockReturnValue([]),
      getActiveSubscription: jest.fn(),
      checkEntitlement: jest.fn().mockReturnValue(false),
    },
  };
});
