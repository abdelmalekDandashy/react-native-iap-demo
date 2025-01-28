import { IapticRN } from "../IapticRN";
import { IapticVerifiedPurchase } from "../types";

/**
 * A transaction that has occurred
 */
interface TokenTransaction {
    /** Unique identifier from the store */
    transactionId: string;
  
    /** Type of token (e.g., 'gems', 'coins', 'credits') */
    tokenType: string;

    /** Number of tokens earned (positive) or spent (negative) for this transaction */
    amount: number;
  
    /** When the transaction occurred */
    timestamp: number;
}

/**
 * Simple token balance manager that uses localStorage to store transactions.
 * 
 * To do this, this class the list of all transactions and their corresponding amounts.
 * 
 * When a transaction is added, it is added to the list.
 * When a transaction is removed, it is removed from the list.
 * 
 * The balance is the sum of all the amounts in the list.
 */
export class TokensManager {
  
    /**
     * Using a Map with transactionId as key ensures each transaction is only stored once
     */
    private transactions: Map<string, TokenTransaction>;

    /**
     * Key used to store transactions in localStorage
     */
    private storageKey = 'iaptic_tokens_transactions';
  
    constructor(iaptic: IapticRN, consumePurchases: boolean = true) {
      this.storageKey = (iaptic.config.appName ?? 'app') + '.tokens.iaptic';
      this.transactions = new Map();
      this.loadTransactions(); // Load stored transactions when instantiated
      iaptic.addEventListener('consumable.purchased', (purchase: IapticVerifiedPurchase) => {
        const product = iaptic.products.getDefinition(purchase.id);
        if (product && product.tokenAmount && product.tokenType) {
          this.addTransaction(this.typeSafeTransactionId(purchase), product.tokenType, product.tokenAmount);
        }
        if (consumePurchases) {
          iaptic.consume(purchase);
        }
      });
      iaptic.addEventListener('consumable.refunded', (purchase: IapticVerifiedPurchase) => {
        this.removeTransaction(this.typeSafeTransactionId(purchase));
      });
    }

    private typeSafeTransactionId(purchase: IapticVerifiedPurchase): string {
      return purchase.transactionId ?? purchase.purchaseId ?? purchase.id;
    }
  
    /**
     * Load transactions from localStorage
     */
    private loadTransactions() {
      try {
        const storedTransactions = localStorage.getItem(this.storageKey);
        if (storedTransactions) {
          const parsedTransactions: TokenTransaction[] = JSON.parse(storedTransactions);
          this.transactions = new Map(
            parsedTransactions.map(t => [t.transactionId, t])
          );
        }
      } catch (error) {
        console.warn('Failed to load transactions:', error);
      }
    }
  
    /**
     * Save current transactions to localStorage
     */
    private saveTransactions() {
      try {
        const transactionsArray = Array.from(this.transactions.values());
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(transactionsArray)
        );
      } catch (error) {
        console.warn('Failed to save transactions:', error);
      }
    }
  
    /**
     * Add a transaction to the map and persist it
     * 
     * @param transactionId - Unique identifier for the transaction
     * @param tokenType - Type of token (e.g., 'gems', 'coins', 'credits')
     * @param amount - Number of tokens earned (positive) or spent (negative)
     */
    addTransaction(transactionId: string, tokenType: string, amount: number) {
      this.transactions.set(transactionId, {
        transactionId,
        tokenType,
        amount,
        timestamp: Date.now()
      });
      this.saveTransactions();
    }
  
    /**
     * Remove a transaction and update storage
     */
    async removeTransaction(transactionId: string) {
      this.transactions.delete(transactionId);
      await this.saveTransactions();
    }
  
    /**
     * Get balance for a specific token type
     */
    getBalance(tokenType: string): number {
      let total = 0;
      this.transactions.forEach(transaction => {
        if (transaction.tokenType === tokenType) {
          total += transaction.amount;
        }
      });
      return total;
    }
  
    /**
     * Get all balances as a map of token type to amount
     */
    getAllBalances(): Map<string, number> {
      const balances = new Map<string, number>();
      
      this.transactions.forEach(transaction => {
        const currentBalance = balances.get(transaction.tokenType) || 0;
        balances.set(transaction.tokenType, currentBalance + transaction.amount);
      });

      return balances;
    }
  
    /**
     * Helper method to check if we've already processed a transaction
     * This can be used before processing a purchase to avoid double-counting
     */
    hasTransaction(transactionId: string): boolean {
      return this.transactions.has(transactionId);
    }
  
    /**
     * Get transaction history for a specific token type
     */
    getTransactions(tokenType?: string): TokenTransaction[] {
      const transactions = Array.from(this.transactions.values());
      return tokenType 
        ? transactions.filter(t => t.tokenType === tokenType)
        : transactions;
    }
  } 