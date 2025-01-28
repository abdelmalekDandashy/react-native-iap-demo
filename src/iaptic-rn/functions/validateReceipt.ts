import { IapticError } from "../classes/IapticError";
import { IapticConfig, IapticErrorCode, IapticProduct, IapticValidateRequest, IapticValidateRequestTransaction, IapticValidateResponse, IapticValidationData } from "../types";
import { Platform } from "react-native";
/**
* Gets the authorization header for API requests
* @returns The Basic auth header string
*/
function getAuthHeader(config: IapticConfig): string {
  const auth = btoa(`${config.appName}:${config.publicKey}`);
  return `Basic ${auth}`;
}

/** Internal function to validate a receipt */
export async function validateReceipt(data: IapticValidationData, products: IapticProduct[], config: IapticConfig): Promise<IapticValidateResponse> {
  const os = Platform.OS;

  const id = os === 'android' ? data.productId : config.iosBundleId ?? data.productId;
  const type = id === data.productId ? data.productType : 'application';

  let transaction: IapticValidateRequestTransaction;
  if (os === 'android') {
    transaction = {
      id: data.transactionId,
      type: 'android-playstore',
      purchaseToken: JSON.parse(data.receipt).purchaseToken,
      receipt: data.receipt,
      signature: data.receiptSignature,
    }
  }
  else if (os === 'ios') {
    transaction = {
      id: data.transactionId,
      type: 'ios-appstore',
      appStoreReceipt: data.receipt
    }
  }
  else {
    throw new IapticError('Unsupported platform', IapticErrorCode.UNKNOWN, 0);
  }

  const request: IapticValidateRequest = {
    id,
    type,
    transaction,
    products,
  };

  if (data.applicationUsername) {
    request.additionalData = {
      applicationUsername: data.applicationUsername
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/v1/validate`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(config),
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
      if (data.code === IapticErrorCode.VALIDATOR_SUBSCRIPTION_EXPIRED) {
        return {
          ok: true,
          data: {
            id,
            collection: [],
            ineligible_for_intro_price: [],
            latest_receipt: true,
            transaction: {},
            date: new Date().toISOString(),
          }
        }
      }
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
      errorMessage = error.message;
    }
    throw new IapticError(errorMessage, error.response?.data?.code ?? error.code ?? IapticErrorCode.UNKNOWN, error.status ?? error.response?.status ?? 0);
  }
}