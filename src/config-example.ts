import { IapticConfig, IapticProductDefinition } from "./iaptic-rn";

export class Config {

  static products: IapticProductDefinition[] = [
    { id: 'one_token',  type: 'consumable', tokenAmount: 1,  tokenType: 'token' },
    { id: 'ten_tokens', type: 'consumable', tokenAmount: 10, tokenType: 'token' },
  ];

  static iaptic: IapticConfig = {
    appName: 'yourappname',
    publicKey: 'your-public-key',
    iosBundleId: 'com.example.demo'
  };
}