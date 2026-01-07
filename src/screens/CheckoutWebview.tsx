import React, { useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { CommonActions } from '@react-navigation/native';

export default function CheckoutWebview({ route, navigation }: any) {
  const { url } = route.params;
  const webViewRef = useRef(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('Current URL:', url);

    if (url.includes('/thank_you') || url.includes('/orders/') || url.includes('payment_complete=true')) {
        Alert.alert(
            "Order Placed", 
            "Your order has been successfully placed!",
            [
                { 
                    text: "OK", 
                    onPress: () => {
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [
                                    { name: 'Home' },
                                ],
                            })
                        );
                    } 
                }
            ]
        );
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        onNavigationStateChange={handleNavigationStateChange}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
