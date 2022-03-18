import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import React, { useState, useContext } from 'react';
import { Platform, StyleSheet, Switch, Text, TextInput } from 'react-native';
import {
  useStripeTerminal,
  PaymentIntent,
  StripeError,
  CommonError,
} from 'stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import { API_URL } from '../Config';
import type { RouteParamList } from '../App';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function CollectCardPaymentScreen() {
  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
    connectedAccountId?: string;
    applicationFeeAmount?: string;
  }>({
    amount: '20000',
    currency: 'USD',
  });
  const [testCardNumber, setTestCardNumber] = useState('4242424242424242');
  const [enableInterac, setEnableInterac] = useState(false);
  const [capturePI, setCapturePI] = useState(true);
  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectCardPayment'>>();
  const { simulated, discoveryMethod } = params;
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const {
    createPaymentIntent,
    collectPaymentMethod,
    processPayment,
    retrievePaymentIntent,
    cancelCollectPaymentMethod,
    setSimulatedCard,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelCollectPaymentMethod,
          },
        ],
      });
    },
    onDidRequestReaderDisplayMessage: (message) => {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: message,
            description: 'terminal.didRequestReaderDisplayMessage',
          },
        ],
      });
      console.log('message', message);
    },
  });

  const createServerPaymentIntent = async (paymentIntentParams: {
    amount: number;
    currency: string;
    paymentMethodTypes: string[];
    setupFutureUsage: 'off_session' | 'on_session';
    on_behalf_of?: string;
    transfer_data_destination?: string;
    application_fee_amount?: number;
  }) => {
    const response = await fetch(`${API_URL}/create_payment_intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentIntentParams),
    });
    const { client_secret, id } = await response.json();
    return { client_secret, id, error: null };
  };

  const capturePaymentIntent = async (id: string) => {
    const response = await fetch(`${API_URL}/capture_payment_intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    return await response.json();
  };

  const _createPaymentIntent = async () => {
    await setSimulatedCard(testCardNumber);

    clearLogs();
    navigation.navigate('LogListScreen');
    addLogs({
      name: 'Create Payment Intent',
      events: [{ name: 'Create', description: 'terminal.createPaymentIntent' }],
    });
    const paymentMethods = ['card_present'];
    if (enableInterac) {
      paymentMethods.push('interac_present');
    }
    let paymentIntent: PaymentIntent.Type | undefined;
    let paymentIntentError: StripeError<CommonError> | undefined;
    if (discoveryMethod === 'internet') {
      const { client_secret } = await createServerPaymentIntent({
        transfer_data_destination: inputValues.connectedAccountId,
        on_behalf_of: inputValues.connectedAccountId,
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: paymentMethods,
        setupFutureUsage: 'off_session',
      });

      const response = await retrievePaymentIntent(client_secret);
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    } else {
      const response = await createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: paymentMethods,
        setupFutureUsage: enableInterac ? undefined : 'off_session',
        onBehalfOf: inputValues.connectedAccountId,
        transferDataDestination: inputValues.connectedAccountId,
        applicationFeeAmount: inputValues.applicationFeeAmount
          ? Number(inputValues.applicationFeeAmount)
          : undefined,
      });
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    }

    if (paymentIntentError) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: paymentIntentError.code,
              errorMessage: paymentIntentError.message,
            },
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Created',
            description: 'terminal.createPaymentIntent',
            metadata: { paymentIntentId: paymentIntent.id },
          },
        ],
      });
      await _collectPaymentMethod(paymentIntent.id);
    }
  };

  const _collectPaymentMethod = async (paymentIntentId: string) => {
    addLogs({
      name: 'Collect Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectPaymentMethod',
          metadata: { paymentIntentId },
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });
    const { paymentIntent, error } = await collectPaymentMethod(
      paymentIntentId
    );

    if (error) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectPaymentMethod',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Collected',
            description: 'terminal.collectPaymentMethod',
            metadata: { paymentIntentId: paymentIntent.id },
          },
        ],
      });
      await _processPayment(paymentIntentId);
    }
  };

  const _processPayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Process',
          description: 'terminal.processPayment',
          metadata: { paymentIntentId },
        },
      ],
    });

    const { paymentIntent, error } = await processPayment(paymentIntentId);
    if (error) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processPayment',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Processed',
            description: 'terminal.processPayment',
            metadata: { paymentIntentId },
          },
        ],
      });
      if (capturePI) {
        _capturePayment(paymentIntentId);
      }
    }
  };

  const _capturePayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Capture Payment',
      events: [{ name: 'Capture', description: 'terminal.capturePayment' }],
    });

    const { intent, error } = await capturePaymentIntent(paymentIntentId);

    if (error) {
      addLogs({
        name: 'Capture Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.capturePayment',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (intent) {
      addLogs({
        name: 'Capture Payment',
        events: [
          {
            name: 'Captured',
            description: 'terminal.paymentIntentId: ' + intent.id,
          },
        ],
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      testID="collect-scroll-view"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List bolded={false} topSpacing={false} title="CARD NUMBER">
        <TextInput
          testID="card-number-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={testCardNumber}
          onChangeText={(value) => setTestCardNumber(value)}
          placeholder="card number"
        />
      </List>
      <List bolded={false} topSpacing={false} title="AMOUNT">
        <TextInput
          testID="amount-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={inputValues.amount}
          onChangeText={(value) =>
            setInputValues((state) => ({ ...state, amount: value }))
          }
          placeholder="amount"
        />
      </List>
      <List bolded={false} topSpacing={false} title="CURRENCY">
        <TextInput
          testID="currency-text-field"
          style={styles.input}
          value={inputValues.currency}
          onChangeText={(value) =>
            setInputValues((state) => ({ ...state, currency: value }))
          }
          placeholder="currency"
        />
      </List>

      <List bolded={false} topSpacing={false} title="PAYMENT METHOD">
        <ListItem
          title="Enable Interac Present"
          rightElement={
            <Switch
              testID="enable-interac"
              value={enableInterac}
              onValueChange={(value) => setEnableInterac(value)}
            />
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="DESTINATION CHARGE">
        <TextInput
          testID="destination-charge"
          style={styles.input}
          value={inputValues.connectedAccountId}
          onChangeText={(value: string) =>
            setInputValues((state) => ({ ...state, connectedAccountId: value }))
          }
          placeholder="Connected Stripe Account ID"
        />
      </List>

      <List bolded={false} topSpacing={false} title="APPLICATION FEE AMOUNT">
        <TextInput
          testID="application-fee-amount"
          style={styles.input}
          value={inputValues.applicationFeeAmount}
          onChangeText={(value: string) =>
            setInputValues((state) => ({
              ...state,
              applicationFeeAmount: value,
            }))
          }
          placeholder="Application Fee Amount"
        />
      </List>
      <List bolded={false} topSpacing={false} title="CAPTURE PAYMENT INTENT">
        <ListItem
          title="Capture Payment Intent"
          rightElement={
            <Switch
              testID="capture-payment-intent"
              value={capturePI}
              onValueChange={(value) => setCapturePI(value)}
            />
          }
        />
      </List>

      <List
        bolded={false}
        topSpacing={false}
        title={`${(Number(inputValues.amount) / 100).toFixed(2)} ${
          inputValues.currency
        }`}
      >
        <ListItem
          color={colors.blue}
          title="Collect payment"
          onPress={_createPaymentIntent}
        />
        {simulated ? (
          <Text style={styles.info}>
            Collect a card payment using a simulated reader
          </Text>
        ) : (
          <Text style={styles.info}>
            Collect a card payment using a physical Stripe test card and reader
          </Text>
        )}
      </List>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingVertical: 22,
    flexGrow: 1,
  },
  json: {
    paddingHorizontal: 16,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    color: colors.dark_gray,
    paddingLeft: 16,
    marginBottom: 12,
    borderBottomColor: colors.gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
        color: colors.dark_gray,
      },
    }),
  },
  enableInteracContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
