
/**
 * Configuration for the iaptic validator
 */
export interface IapticConfig {
  appName: string;
  publicKey: string;
  /** The base URL of the iaptic validator */
  baseUrl?: string;
}

/**
 * Data needed to validate a purchase
 */ 
export interface IapticValidationData {
  productId: string,
  transactionId: string,
  receipt: string,
  productType: IapticProductType,
  applicationUsername?: string;
}

/**
 * Product types supported by the iaptic validator
 */
export type IapticProductType = 'application' | 'paid subscription' | 'non renewing subscription' | 'consumable' | 'non consumable';

/**
 * Request to iaptic validator endpoint
 */
export interface IapticValidateRequest {
  id: string;
  type: IapticProductType;
  transaction: {
    id: string;
    type: string;
    appStoreReceipt?: string;
    // Add other transaction fields as needed for Google/Android
  };
  additionalData?: {
    applicationUsername?: string;
  };
}

//
// VALIDATOR SUCCESS RESPONSE DEFINITIONS
//

/**
 * Response from the iaptic validator endpoint
 */
export type IapticValidateResponse = IapticValidateSuccessPayload | IapticValidateErrorPayload;

/** Success response from iaptic validator endpoint */
export interface IapticValidateSuccessPayload {

  /** Indicates a successful request */
  ok: true;

  data: {
    /** The collection of purchases in this receipt.
     *
     * An array of ValidatorPurchase */
    collection?: IapticVerifiedPurchase[];
    /** List of product ids for which intro price isn't available anymore */
    ineligible_for_intro_price?: string[];
    /** Id of the product that have been validated */
    id: string;
    /** Tell the plugin that we've used the latest receipt */
    latest_receipt: boolean;
    /** Native transaction detail */
    transaction: any;
    /** A warning message about this validation.
     *
     * It might be present when the server had to fallback to a backup validation solution. */
    warning?: string;
    /** Date and time the receipt was validated.
     *
     * It will provide the client with a more reliable clock time
     * than the user's device when needed. */
    date?: ISODate;
  }
}

/**
 * Dates stored as a ISO formatted string
 */
type ISODate = string;

/**
 * A purchase object returned by the receipt validator.
 */
export interface IapticVerifiedPurchase {

  /** Product identifier */
  id: string;

  /** Platform this purchase was made on */
  platform?: PurchasePlatform;

  /** Purchase identifier (optional) */
  purchaseId?: string;

  /** Identifier of the last transaction (optional) */
  transactionId?: string;

  /** Date of first purchase (timestamp). */
  purchaseDate?: number;

  /** Date of expiry for a subscription. */
  expiryDate?: number;

  /** True when a subscription is expired. */
  isExpired?: boolean;

  /** Renewal intent. */
  renewalIntent?: string;

  /** Date the renewal intent was updated by the user. */
  renewalIntentChangeDate?: number;

  /** The reason a subscription or purchase was cancelled. */
  cancelationReason?: CancelationReason;

  /** True when a subscription a subscription is in the grace period after a failed attempt to collect payment */
  isBillingRetryPeriod?: boolean;

  /** True when a subscription is in trial period */
  isTrialPeriod?: boolean;

  /** True when a subscription is in introductory pricing period */
  isIntroPeriod?: boolean;

  /** Identifier of the discount currently applied to a purchase.
   *
   * Correspond to the product's offerId. When undefined it means there is only one offer for the given product. */
  discountId?: string;

  /** Whether or not the user agreed or has been notified of a price change. */
  priceConsentStatus?: PriceConsentStatus;

  /** Last time a subscription was renewed. */
  lastRenewalDate?: number;
}

/** Reason why a subscription has been canceled */
export enum CancelationReason {
  /** Not canceled */
  NOT_CANCELED = '',
  /** Subscription canceled by the developer. */
  DEVELOPER = 'Developer',
  /** Subscription canceled by the system for an unspecified reason. */
  SYSTEM = 'System',
  /** Subscription upgraded or downgraded to a new subscription. */
  SYSTEM_REPLACED = 'System.Replaced',
  /** Product not available for purchase at the time of renewal. */
  SYSTEM_PRODUCT_UNAVAILABLE = 'System.ProductUnavailable',
  /** Billing error; for example customer’s payment information is no longer valid. */
  SYSTEM_BILLING_ERROR = 'System.BillingError',
  /** Transaction is gone; It has been deleted. */
  SYSTEM_DELETED = 'System.Deleted',
  /** Subscription canceled by the user for an unspecified reason. */
  CUSTOMER = 'Customer',
  /** Customer canceled their transaction due to an actual or perceived issue within your app. */
  CUSTOMER_TECHNICAL_ISSUES = 'Customer.TechnicalIssues',
  /** Customer did not agree to a recent price increase. See also priceConsentStatus. */
  CUSTOMER_PRICE_INCREASE = 'Customer.PriceIncrease',
  /** Customer canceled for cost-related reasons. */
  CUSTOMER_COST = 'Customer.Cost',
  /** Customer claimed to have found a better app. */
  CUSTOMER_FOUND_BETTER_APP = 'Customer.FoundBetterApp',
  /** Customer did not feel he is using this service enough. */
  CUSTOMER_NOT_USEFUL_ENOUGH = 'Customer.NotUsefulEnough',
  /** Subscription canceled for another reason; for example, if the customer made the purchase accidentally. */
  CUSTOMER_OTHER_REASON = 'Customer.OtherReason',
  /** Subscription canceled for unknown reasons. */
  UNKNOWN = 'Unknown'
}

/** Whether or not the user was notified or agreed to a price change */
export enum PriceConsentStatus {
  NOTIFIED = 'Notified',
  AGREED = 'Agreed',
}

/**
 * Purchase platforms supported by the plugin
 */
export enum PurchasePlatform {

  /** Apple AppStore */
  APPLE_APPSTORE = 'ios-appstore',

  /** Google Play */
  GOOGLE_PLAY = 'android-playstore',

  /** Windows Store */
  WINDOWS_STORE = 'windows-store-transaction',

  /** Braintree */
  BRAINTREE = 'braintree',

  // /** Stripe */
  // STRIPE = 'stripe',

  /** Test platform */
  TEST = 'test',
}

//
// VALIDATOR FAILURE RESPONSE DEFINITIONS
//

/** Error response from the validator endpoint */
export interface IapticValidateErrorPayload {
  /** Value `false` indicates that the request returned an error */
  ok: false;
  /** Error status (HTTP status) */
  status?: number;
  /** An ErrorCode */
  code?: IapticErrorCode;
  /** Human readable description of the error */
  message?: string;

  data?: {
    /** We validated using the latest version of the receipt, not need to refresh it. */
    latest_receipt?: boolean;
  };
}

const ERROR_CODES_BASE = 6777000;

/**
 * Error codes
 */
export enum IapticErrorCode {

  /** Error: Failed to intialize the in-app purchase library */
  SETUP = ERROR_CODES_BASE + 1,
  /** Error: Failed to load in-app products metadata */
  LOAD = ERROR_CODES_BASE + 2,
  /** Error: Failed to make a purchase */
  PURCHASE = ERROR_CODES_BASE + 3,
  /** Error: Failed to load the purchase receipt */
  LOAD_RECEIPTS = ERROR_CODES_BASE + 4,
  /** Error: Client is not allowed to issue the request */
  CLIENT_INVALID = ERROR_CODES_BASE + 5,
  /** Error: Purchase flow has been cancelled by user */
  PAYMENT_CANCELLED = ERROR_CODES_BASE + 6,
  /** Error: Something is suspicious about a purchase */
  PAYMENT_INVALID = ERROR_CODES_BASE + 7,
  /** Error: The user is not allowed to make a payment */
  PAYMENT_NOT_ALLOWED = ERROR_CODES_BASE + 8,
  /** Error: Unknown error */
  UNKNOWN = ERROR_CODES_BASE + 10,
  /** Error: Failed to refresh the purchase receipt */
  REFRESH_RECEIPTS = ERROR_CODES_BASE + 11,
  /** Error: The product identifier is invalid */
  INVALID_PRODUCT_ID = ERROR_CODES_BASE + 12,
  /** Error: Cannot finalize a transaction or acknowledge a purchase */
  FINISH = ERROR_CODES_BASE + 13,
  /** Error: Failed to communicate with the server */
  COMMUNICATION = ERROR_CODES_BASE + 14,
  /** Error: Subscriptions are not available */
  SUBSCRIPTIONS_NOT_AVAILABLE = ERROR_CODES_BASE + 15,
  /** Error: Purchase information is missing token */
  MISSING_TOKEN = ERROR_CODES_BASE + 16,
  /** Error: Verification of store data failed */
  VERIFICATION_FAILED = ERROR_CODES_BASE + 17,
  /** Error: Bad response from the server */
  BAD_RESPONSE = ERROR_CODES_BASE + 18,
  /** Error: Failed to refresh the store */
  REFRESH = ERROR_CODES_BASE + 19,
  /** Error: Payment has expired */
  PAYMENT_EXPIRED = ERROR_CODES_BASE + 20,
  /** Error: Failed to download the content */
  DOWNLOAD = ERROR_CODES_BASE + 21,
  /** Error: Failed to update a subscription */
  SUBSCRIPTION_UPDATE_NOT_AVAILABLE = ERROR_CODES_BASE + 22,
  /** Error: The requested product is not available in the store. */
  PRODUCT_NOT_AVAILABLE = ERROR_CODES_BASE + 23,
  /** Error: The user has not allowed access to Cloud service information */
  CLOUD_SERVICE_PERMISSION_DENIED = ERROR_CODES_BASE + 24,
  /** Error: The device could not connect to the network. */
  CLOUD_SERVICE_NETWORK_CONNECTION_FAILED = ERROR_CODES_BASE + 25,
  /** Error: The user has revoked permission to use this cloud service. */
  CLOUD_SERVICE_REVOKED = ERROR_CODES_BASE + 26,
  /** Error: The user has not yet acknowledged Apple’s privacy policy */
  PRIVACY_ACKNOWLEDGEMENT_REQUIRED = ERROR_CODES_BASE + 27,
  /** Error: The app is attempting to use a property for which it does not have the required entitlement. */
  UNAUTHORIZED_REQUEST_DATA = ERROR_CODES_BASE + 28,
  /** Error: The offer identifier is invalid. */
  INVALID_OFFER_IDENTIFIER = ERROR_CODES_BASE + 29,
  /** Error: The price you specified in App Store Connect is no longer valid. */
  INVALID_OFFER_PRICE = ERROR_CODES_BASE + 30,
  /** Error: The signature in a payment discount is not valid. */
  INVALID_SIGNATURE = ERROR_CODES_BASE + 31,
  /** Error: Parameters are missing in a payment discount. */
  MISSING_OFFER_PARAMS = ERROR_CODES_BASE + 32,

  /**
   * Server code used when a subscription expired.
   *
   * @deprecated Validator should now return the transaction in the collection as expired.
   */
  VALIDATOR_SUBSCRIPTION_EXPIRED = 6778003
}
