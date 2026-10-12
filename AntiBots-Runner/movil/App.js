import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { WebView } from 'react-native-webview';

export default function App() {
  const [pageUri, setPageUri] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Asset.fromModule(require('./assets/game.html')).downloadAsync()
      .then(asset => { if (active) setPageUri(asset.localUri || asset.uri); })
      .catch(err => { if (active) setError(String(err)); });
    // Prevent hardware Back from unexpectedly closing the game.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { active = false; sub.remove(); };
  }, []);
  return <SafeAreaView style={styles.root}>
    <StatusBar hidden />
    {error ? <View style={styles.center}><Text style={styles.message}>No se pudo cargar AntiBots Runner: {error}</Text></View>
      : pageUri ? <WebView
        style={styles.webview}
        source={{ uri: pageUri }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowingReadAccessToURL={pageUri}
        allowingFileAccessFromFileURLs
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        overScrollMode="never"
        mixedContentMode="always"
        onError={(event) => setError(event.nativeEvent.description || 'Error de WebView')}
      /> : <View style={styles.center}><ActivityIndicator size="large" color="#ed3347" /><Text style={styles.message}>Cargando AntiBots Runner…</Text></View>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({root:{flex:1,backgroundColor:'#08070c'}, webview:{flex:1,backgroundColor:'#08070c'},center:{flex:1,justifyContent:'center',alignItems:'center'},message:{color:'#fff',textAlign:'center',marginTop:16}});
