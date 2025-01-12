
/**
 * A transaction that has occurred
 */
interface TokenTransaction {
  /** Unique identifier from the store */
  transactionId: string;

  /** Number of tokens earned or spent for this transaction */
  amount: number;

  /** When the transaction occurred */
  timestamp: number;
};

/**
 * Manages the token balance of the user.
 * 
 * To do this, this class the list of all transactions and their corresponding amounts.
 * 
 * When a transaction is added, it is added to the list.
 * When a transaction is removed, it is removed from the list.
 * 
 * The balance is the sum of all the amounts in the list.
 */
export class TokenManager {

  /**
   * Using a Map with transactionId as key ensures each transaction is only stored once
   */
  private transactions: Map<string, TokenTransaction>;

  constructor() {
    this.transactions = new Map();
  }

  /**
   * Add a transaction to the map.
   * 
   * Since we use transactionId as key in the Map, calling addTransaction
   * with the same transactionId will simply overwrite the previous entry,
   * preventing double-counting
   */
  addTransaction(transactionId: string, amount: number) {
    this.transactions.set(transactionId, {
      transactionId,
      amount,
      timestamp: Date.now()
    });
  }

  /**
   * Remove a transaction, when it is cancelled or refunded
   */
  removeTransaction(transactionId: string) {
    this.transactions.delete(transactionId);
  }

  /**
   * Sum all transaction amounts to get total balance
   * Each transaction is counted exactly once since it can only exist once in the Map
   */
  getBalance(): number {
    let total = 0;
    this.transactions.forEach(transaction => {
      total += transaction.amount;
    });
    return total;
  }

  /**
   * Helper method to check if we've already processed a transaction
   * This can be used before processing a purchase to avoid double-counting
   */
  hasTransaction(transactionId: string): boolean {
    return this.transactions.has(transactionId);
  }

  /**
   * Get transaction history for debugging or display
   */
  getTransactions(): TokenTransaction[] {
    return Array.from(this.transactions.values());
  }
} 