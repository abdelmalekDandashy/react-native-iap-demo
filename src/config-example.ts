import { IapticConfig } from "./iaptic-rn";
import { ProductDefinition } from "./IapProducts";

export class Config {

  static appIdentifiers = {
    ios: "com.example.demo",
    android: "com.example.demo"
  };

  static products: ProductDefinition[] = [
    { id: 'one_token', type: 'consumable', numTokens: 1 },
    { id: 'ten_tokens', type: 'consumable', numTokens: 10 },
  ];

  static iaptic: IapticConfig = {
    appName: 'yourappname',
    publicKey: 'your-public-key'
  };
}