const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Package the complete offline HTML game as an Expo asset.
config.resolver.assetExts.push('html');
module.exports = config;
