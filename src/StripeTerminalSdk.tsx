import { NativeModules } from 'react-native';
import type {
  InitParams,
  StripeError,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  CancelDiscoveringResultType,
  ConnectBluetoothReaderParams,
  DisconnectReaderResultType,
  RebootReaderResultType,
  Reader,
  ConnectInternetReaderParams,
  ConnectUsbReaderParams,
  CreatePaymentIntentParams,
  CollectSetupIntentPaymentMethodParams,
  PaymentIntentResultType,
  Cart,
  SetupIntentResultType,
  CreateSetupIntentParams,
  ClearReaderDisplayResultType,
  GetLocationsParams,
  GetLocationsResultType,
  RefundParams,
  CollectRefundPaymentMethodType,
  ConfirmRefundResultType,
  SetConnectionTokenParams,
  ConnectHandoffParams,
  ConnectLocalMobileParams,
  ConnectReaderResultType,
  CollectPaymentMethodParams,
  PaymentIntent,
  SetupIntent,
  OfflineStatus,
  CollectInputsParameters,
  CollectInputsResults,
} from './types';

const { StripeTerminalReactNative } = NativeModules;

type InitializeResultNativeType = Promise<{
  error?: StripeError;
  reader?: Reader.Type;
}>;

interface InternalInitParams extends InitParams {
  reactNativeVersion: string;
}

export interface StripeTerminalSdkType {
  // Initialize StripeTerminalSdk native module
  initialize(params: InternalInitParams): InitializeResultNativeType;
  // Set connection token
  setConnectionToken(params: SetConnectionTokenParams): Promise<void>;
  // Discover readers by connection type
  discoverReaders(params: DiscoverReadersParams): DiscoverReadersResultType;
  // Cancel discovering readers
  cancelDiscovering(): CancelDiscoveringResultType;
  // Connect to reader via bluetooth
  connectBluetoothReader(
    params: ConnectBluetoothReaderParams
  ): Promise<ConnectReaderResultType>;
  // Connect to reader via internet
  connectInternetReader(
    params: ConnectInternetReaderParams
  ): Promise<ConnectReaderResultType>;
  connectHandoffReader(
    params: ConnectHandoffParams
  ): Promise<ConnectReaderResultType>;
  connectLocalMobileReader(
    params: ConnectLocalMobileParams
  ): Promise<ConnectReaderResultType>;
  // Connect to reader via USB
  connectUsbReader(
    params: ConnectUsbReaderParams
  ): Promise<ConnectReaderResultType>;
  // Disconnect reader
  disconnectReader(): Promise<DisconnectReaderResultType>;
  // Reboot reader
  rebootReader(): Promise<RebootReaderResultType>;
  // Create a payment intent
  createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResultType>;
  // Collect Payment Method
  collectPaymentMethod(
    params: CollectPaymentMethodParams
  ): Promise<PaymentIntentResultType>;
  // Retrieve Payment Intent
  retrievePaymentIntent(clientSecret: string): Promise<PaymentIntentResultType>;
  // Confirm Payment Intent
  confirmPaymentIntent(
    paymentIntentJson: PaymentIntent.Type
  ): Promise<PaymentIntentResultType>;
  // Create Setup Intent
  createSetupIntent(
    params: CreateSetupIntentParams
  ): Promise<SetupIntentResultType>;
  // Cancel Payment Intent
  cancelPaymentIntent(
    paymentIntent: PaymentIntent.Type
  ): Promise<PaymentIntentResultType>;
  // Collect Setup Intent payment method
  collectSetupIntentPaymentMethod(
    params: CollectSetupIntentPaymentMethodParams
  ): Promise<SetupIntentResultType>;
  // Install available update
  installAvailableUpdate(): Promise<void>;
  // Cancel installing software update
  cancelInstallingUpdate(): Promise<void>;
  // Set text on a reader display
  setReaderDisplay(cart: Cart): Promise<{
    error?: StripeError;
  }>;
  // Clear reader display
  clearReaderDisplay(): Promise<ClearReaderDisplayResultType>;
  retrieveSetupIntent(clientSecret: string): Promise<SetupIntentResultType>;
  // Cancel Setup Intent
  cancelSetupIntent(
    setupIntent: SetupIntent.Type
  ): Promise<SetupIntentResultType>;
  // List of locations belonging to the merchant
  getLocations(params: GetLocationsParams): Promise<GetLocationsResultType>;
  // Confirm Setup Intent
  confirmSetupIntent(
    setupIntent: SetupIntent.Type
  ): Promise<SetupIntentResultType>;
  simulateReaderUpdate(update: Reader.SimulateUpdateType): Promise<void>;
  collectRefundPaymentMethod(
    params: RefundParams
  ): Promise<CollectRefundPaymentMethodType>;
  cancelCollectRefundPaymentMethod(): Promise<{
    error?: StripeError;
  }>;
  confirmRefund(): Promise<ConfirmRefundResultType>;
  clearCachedCredentials(): Promise<{
    error?: StripeError;
  }>;
  cancelCollectPaymentMethod(): Promise<{
    error?: StripeError;
  }>;
  cancelCollectSetupIntent(): Promise<{
    error?: StripeError;
  }>;
  setSimulatedCard(cardNumber: string): Promise<{
    error?: StripeError;
  }>;
  getOfflineStatus(): Promise<OfflineStatus>;
  getReaderSettings(): Promise<Reader.ReaderSettings>;
  setReaderSettings(
    params: Reader.ReaderSettingsParameters
  ): Promise<Reader.ReaderSettings>;
  collectInputs(params: CollectInputsParameters): Promise<CollectInputsResults>;
  cancelCollectInputs(): Promise<{
    error?: StripeError;
  }>;
  cancelReaderReconnection(): Promise<{
    error?: StripeError;
  }>;
}

export default StripeTerminalReactNative as StripeTerminalSdkType;
