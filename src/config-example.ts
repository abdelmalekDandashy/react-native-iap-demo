import { IapticConfig } from "react-native-iaptic";

export class Config {

  static iaptic: IapticConfig = {
    appName: 'com.synmedia.tapyn',
    publicKey: '6606eedf-6f02-44a4-8ee3-be4eb391c3e7',
    iosBundleId: 'com.example.demo',
    products: [
      { id: 'one_token',  type: 'consumable', tokenValue: 1,  tokenType: 'token' },
      { id: 'ten_tokens', type: 'consumable', tokenValue: 10, tokenType: 'token' },
      { id: 'basic_subscription', type: 'paid subscription', entitlements: ['basic'] },
      { id: 'premium_subscription', type: 'paid subscription', entitlements: ['basic', 'premium'] },
    ]
  };
}