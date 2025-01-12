import { Config } from "./Config";

/**
 * Definition for a in-app product.
 */
export interface ProductDefinition {
  type: 'consumable' | 'non consumable' | 'paid subscription';
  id: string;
  numTokens: number;
}

/**
 * Definition for the in-app products you defined in App Store Connect or Google Play Console.
 */
export class IapProducts {

  /**
   * Our list of products
   */
  static list: ProductDefinition[] = Config.products;

  /**
   * Check if a product is consumable
   * 
   * @param productId - The ID of the product
   * @returns true if the product is consumable, false otherwise
   */
  static isConsumable(productId: string) {
    return IapProducts.list.find(p => p.id === productId)?.type === 'consumable';
  }

  /**
   * Get the list of product IDs
   */
  static getProductIds() {
    return IapProducts.list.map(p => p.id);
  }

  /**
   * Get the number of tokens to award for a given product
   * 
   * @param productId - The ID of the product
   * @returns The number of tokens for the product
   */
  static numTokens(productId: string) {
    return IapProducts.list.find(p => p.id === productId)?.numTokens || 0;
  }
}

// @ts-ignore
window['_IapProducts'] = IapProducts;