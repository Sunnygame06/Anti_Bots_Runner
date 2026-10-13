import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import { WebView } from 'react-native-webview';

export default function App() {
  const [pageUri, setPageUri] = useState(null);
  const [audioUris, setAudioUris] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([
      Asset.fromModule(require('./assets/game.html')).downloadAsync(),
      Asset.fromModule(require('./assets/audio/elta-theme.m4a')).downloadAsync(),
      Asset.fromModule(require('./assets/audio/misil.m4a')).downloadAsync(),
      Asset.fromModule(require('./assets/audio/rayo.m4a')).downloadAsync(),
      Asset.fromModule(require('./assets/audio/companion-move.m4a')).downloadAsync(),
      Asset.fromModule(require('./assets/audio/dragon-roar.m4a')).downloadAsync()
    ])
      .then(([page, soundtrack, missile, lightning, companionMove, dragonRoar]) => {
        if (!active) return;
        setPageUri(page.localUri || page.uri);
        setAudioUris({
          'elta-theme.m4a': soundtrack.localUri || soundtrack.uri,
          'misil.m4a': missile.localUri || missile.uri,
          'rayo.m4a': lightning.localUri || lightning.uri,
          'companion-move.m4a': companionMove.localUri || companionMove.uri,
          'dragon-roar.m4a': dragonRoar.localUri || dragonRoar.uri
        });
      })
      .catch(err => { if (active) setError(String(err)); });
    // Prevent hardware Back from unexpectedly closing the game.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { active = false; sub.remove(); };
  }, []);
  return <SafeAreaView style={styles.root}>
    <StatusBar hidden />
    {error ? <View style={styles.center}><Text style={styles.message}>No se pudo cargar AntiBots Runner: {error}</Text></View>
      : pageUri && audioUris ? <WebView
        style={styles.webview}
        source={{ uri: pageUri }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowingReadAccessToURL={pageUri}
        allowingFileAccessFromFileURLs
        injectedJavaScriptBeforeContentLoaded={`window.__ANTIBOTS_AUDIO_URIS=${JSON.stringify(audioUris)};true;`}
        injectedJavaScript={`window.__ANTIBOTS_AUDIO_URIS=${JSON.stringify(audioUris)};true;`}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        overScrollMode="never"
        mixedContentMode="always"
        onError={(event) => setError(event.nativeEvent.description || 'Error de WebView')}
      /> : <View style={styles.center}><ActivityIndicator size="large" color="#ed3347" /><Text style={styles.message}>Cargando AntiBots Runner…</Text></View>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({root:{flex:1,backgroundColor:'#08070c'}, webview:{flex:1,backgroundColor:'#08070c'},center:{flex:1,justifyContent:'center',alignItems:'center'},message:{color:'#fff',textAlign:'center',marginTop:16}});
