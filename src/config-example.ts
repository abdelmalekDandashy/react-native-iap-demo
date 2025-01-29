import { IapticConfig, IapticProductDefinition } from "./iaptic-rn";

export class Config {

  static products: IapticProductDefinition[] = [
    { id: 'one_token',  type: 'consumable', tokenValue: 1,  tokenType: 'token' },
    { id: 'ten_tokens', type: 'consumable', tokenValue: 10, tokenType: 'token' },
  ];

  static iaptic: IapticConfig = {
    appName: 'yourappname',
    publicKey: 'your-public-key',
    iosBundleId: 'com.example.demo'
  };
}