import { IapticConfig } from "react-native-iaptic";

export class Config {
  static iaptic: IapticConfig = {
    appName: 'com.synmedia.tapyn',
    publicKey: 'your-public-6606eedf-6f02-44a4-8ee3-be4eb391c3e7',
    iosBundleId: 'com.synmedia.tapyn',
    products: [
      // Consumable token bundles
      { id: 'tapyn500',           type: 'consumable', tokenValue: 500,    tokenType: 'coin' },
      { id: 'tapyn2025',          type: 'consumable', tokenValue: 2025,   tokenType: 'coin' },
      { id: 'tapyn5125',          type: 'consumable', tokenValue: 5125,   tokenType: 'coin' },
      { id: 'tapyn10500',         type: 'consumable', tokenValue: 10500,  tokenType: 'coin' },
      { id: 'tapyn55000',         type: 'consumable', tokenValue: 55000,  tokenType: 'coin' },
      { id: 'most_popular_combo', type: 'consumable', tokenValue: 10000, tokenType: 'coin' },
      { id: 'welcome_offer',      type: 'consumable', tokenValue: 500,    tokenType: 'coin' },

      // Auto‑renewable subscriptions (tapyn_group)
      { id: 'weekly_plan',                         type: 'paid subscription', entitlements: ['male'] },
      { id: 'tapynSubscription',                   type: 'paid subscription', entitlements: ['tapyn'] },
      { id: 'infinity_yearly',                     type: 'paid subscription', entitlements: ['infinity'] },
      { id: 'infinity_monthly',                    type: 'paid subscription', entitlements: ['infinity'] },
      { id: 'infinity_yearly_halloween_sub',       type: 'paid subscription', entitlements: ['halloween'] },
      { id: 'infinity_monthly_halloween_sub',      type: 'paid subscription', entitlements: ['halloween'] },
    ]
  };
}
