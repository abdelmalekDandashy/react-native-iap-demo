import { IapticOffer, IapticPendingPurchaseState, IapticPendingPurchase } from "../types";
import { IapticEvents } from "./IapticEvents";


/**
 * Keep track of the state of pending purchases.
 */
export class PendingPurchases {
  private pendingPurchases: IapticPendingPurchase[] = [];

  constructor(private readonly events: IapticEvents) {}

  public get(): IapticPendingPurchase[] {
    return this.pendingPurchases;
  }

  public has(productId: string): boolean {
    return this.pendingPurchases.find(p => p.productId === productId) !== undefined;
  }

  public add(offer: IapticOffer) {
    if (this.pendingPurchases.find(p => p.productId === offer.productId)) {
      return;
    }
    this.pendingPurchases.push({productId: offer.productId, status: 'purchasing'});
  }

  public remove(productId: string) {
    this.pendingPurchases = this.pendingPurchases.filter(p => p.productId !== productId);
  }

  public update(productId: string, status: IapticPendingPurchaseState) {
    const purchase = this.pendingPurchases.find(p => p.productId === productId);
    if (purchase) {
      if (status === 'completed') {
        this.remove(productId);
      }
      else {
        purchase.status = status;
      }
      this.events.emit('pendingPurchase.updated', purchase);
    }
  }
}
