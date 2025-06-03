// Add these polyfills at the very top of your index.js
// import { polyfill } from 'react-native-polyfill-globals/src/fetch';
// polyfill();

// // @ts-ignore

import {fetch as expoFetch} from 'expo/fetch';

import { Platform } from 'react-native';
import 'text-encoding';


if(Platform.OS !== 'web') {
    
    globalThis.fetch = expoFetch;
}

// Your existing app entry point
import 'expo-router/entry';