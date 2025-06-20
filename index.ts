// Add these polyfills at the very top of your index.js
// import { polyfill } from 'react-native-polyfill-globals/src/fetch';
// polyfill();

import { ReadableStream as ReadableStreamPolyfill } from 'web-streams-polyfill/dist/ponyfill';
// // @ts-ignore

import {fetch as expoFetch} from 'expo/fetch';

import { Platform } from 'react-native';
import 'text-encoding';


if(Platform.OS !== 'web') {
    
    globalThis.fetch = expoFetch;
    globalThis.ReadableStream = ReadableStreamPolyfill;
    globalThis.structuredClone = function(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    };
}

// Your existing app entry point
import 'expo-router/entry';