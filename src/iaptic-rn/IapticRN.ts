import { getReceiptIOS, ProductPurchase, transactionListener } from "react-native-iap";
import { Platform as PlatformRN } from "react-native";
import { IapticConfig, IapticErrorCode, IapticProductType, IapticValidateRequest, IapticValidateResponse, IapticValidationData, IapticVerifiedPurchase } from "./types";

export class IapticError extends Error {
  constructor(message: string, public readonly code: IapticErrorCode, public readonly status: number) {
    super(message);
    this.name = 'IapticError';
  }
}

export class IapticRN {
  private readonly config: IapticConfig;

  constructor(config: IapticConfig) {
    this.config = config;
    if (!this.config.baseUrl) {
      this.config.baseUrl = 'https://validator.iaptic.com';
    }
  }

  /**
   * Validate and register a purchase with iaptic receipt validator.
   * 
   * @param purchase - The purchase to validate
   * @param productType - The type of the product
   * @param applicationUsername - The username of the application
   * @returns The validated purchase or undefined if the purchase is not valid
   */
  async validatePurchase(purchase: ProductPurchase, productType: IapticProductType, applicationUsername: string): Promise<IapticVerifiedPurchase | undefined> {
    if (!purchase.transactionId) {
      throw new Error('Transaction ID is required');
    }

    let receipt: string | undefined | null = purchase.transactionReceipt;
    if (!receipt && PlatformRN.OS === 'ios') {
      receipt = await getReceiptIOS({ forceRefresh: true });
    }

    const result = await this.validateReceipt({
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      receipt: receipt || '',
      productType: productType,
      applicationUsername: applicationUsername
    });
    if (result.ok) {
      return result.data.collection?.find(vPurchase => vPurchase.id === purchase.productId);
    }
    else {
      throw new IapticError(result.message ?? 'Failed to validate purchase', result.code ?? IapticErrorCode.UNKNOWN, result.status ?? 0);
    }
  }

  private async validateReceipt(data: IapticValidationData): Promise<IapticValidateResponse> {
    const os = PlatformRN.OS;

    const request: IapticValidateRequest = {
      id: data.productId,
      type: data.productType, // Adjust based on your product type
      transaction: {
        id: data.transactionId,
        type: (os === 'android') ? 'android-playstore' : 'ios-appstore',
        ...((os === 'android')
          ? {
            purchaseToken: JSON.parse(data.receipt).purchaseToken,
            receipt: data.receipt
          }
          : {
            appStoreReceipt: data.receipt
          })
      }
    };

    if (data.applicationUsername) {
      request.additionalData = {
        applicationUsername: data.applicationUsername
      };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/validate`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new IapticError(response.statusText, IapticErrorCode.COMMUNICATION, response.status);
      }

      let data: IapticValidateResponse;
      try {
        data = await response.json();
      } catch (error) {
        throw new IapticError('Failed to parse response', IapticErrorCode.BAD_RESPONSE, response.status);
      }

      if (!data.ok) {
        throw new IapticError(data.message ?? 'Receipt validation failed', data.code ?? IapticErrorCode.UNKNOWN, data.status ?? 0);
      }

      return data;
    } catch (error: any) {
      let errorMessage = 'Receipt validation failed';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please check your iaptic configuration.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid purchase data. Please check the receipt format.';
      } else if (error.message) {
        errorMessage = `Validation error: ${error.message}`;
      }
      throw new IapticError(errorMessage, error.response?.data?.code ?? error.code ?? IapticErrorCode.UNKNOWN, error.status ?? error.response?.status ?? 0);
    }
  }

  private getAuthHeader(): string {
    const auth = btoa(`${this.config.appName}:${this.config.publicKey}`);
    return `Basic ${auth}`;
  }
}
