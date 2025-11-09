// Add these polyfills at the very top of your index.js
// import { polyfill } from 'react-native-polyfill-globals/src/fetch';
// polyfill();

//import { ReadableStream as ReadableStreamPolyfill } from 'web-streams-polyfill/dist/ponyfill';
// // @ts-ignore

import { ReadableStream, TransformStream } from "web-streams-polyfill";
import {fetch as expoFetch} from 'expo/fetch';
import structuredClone from "@ungap/structured-clone";

import { Platform } from 'react-native';
import 'text-encoding';


if(Platform.OS !== 'web') {
    
    const setupPolyfills = async () => {
    const { polyfillGlobal } = await import(
      "react-native/Libraries/Utilities/PolyfillFunctions"
    );

    const { TextEncoderStream, TextDecoderStream } = await import(
      "@stardazed/streams-text-encoding"
    );

    if (!("structuredClone" in global)) {
      polyfillGlobal("structuredClone", () => structuredClone);
    }

    polyfillGlobal("TextEncoderStream", () => TextEncoderStream);
    polyfillGlobal("TextDecoderStream", () => TextDecoderStream);
    polyfillGlobal("FileList", () => FileList);
    polyfillGlobal("TransformStream", () => TransformStream);
    
    // Polyfill ReadableStream with async iterator support
    polyfillGlobal("ReadableStream", () => {
      // Add async iterator support to ReadableStream prototype
      if (!ReadableStream.prototype[Symbol.asyncIterator]) {
        ReadableStream.prototype.values ??= function({ preventCancel = false } = {}) {
          const reader = this.getReader();
          return {
            async next() {
              try {
                const result = await reader.read();
                if (result.done) {
                  reader.releaseLock();
                }
                return result;
              } catch (e) {
                reader.releaseLock();
                throw e;
              }
            },
            async return(value) {
              if (!preventCancel) {
                const cancelPromise = reader.cancel(value);
                reader.releaseLock();
                await cancelPromise;
              } else {
                reader.releaseLock();
              }
              return { done: true, value };
            },
            [Symbol.asyncIterator]() {
              return this;
            }
          };
        };

        ReadableStream.prototype[Symbol.asyncIterator] ??= ReadableStream.prototype.values;
      }
      
      return ReadableStream;
    });
    
    // Polyfill Response to properly handle ReadableStream as body
    const OriginalResponse = global.Response;
    
    polyfillGlobal("Response", () => {
      class ResponseWithStream extends OriginalResponse {
        constructor(body, init) {
          // If body is a ReadableStream, we need to handle it specially
          if (body && typeof body === 'object' && typeof body.getReader === 'function') {
            // Create a dummy response first
            super(null, init);
            
            // Store the stream as a property
            Object.defineProperty(this, '_bodyStream', {
              value: body,
              writable: false,
              enumerable: false,
              configurable: false
            });
            
            // Override the body getter to return our stream
            Object.defineProperty(this, 'body', {
              get() {
                return this._bodyStream;
              },
              enumerable: true,
              configurable: true
            });
            
            // Override bodyUsed to track if stream has been consumed
            let bodyUsed = false;
            Object.defineProperty(this, 'bodyUsed', {
              get() {
                return bodyUsed;
              },
              set(value) {
                bodyUsed = value;
              },
              enumerable: true,
              configurable: true
            });
            
            console.log('[Response Polyfill] Created Response with ReadableStream body');
          } else {
            // For non-stream bodies, use original behavior
            super(body, init);
          }
        }
        
        // Override methods that consume the body to mark bodyUsed
        async text() {
          if (this._bodyStream) {
            this.bodyUsed = true;
            const reader = this._bodyStream.getReader();
            const chunks = [];
            const decoder = new TextDecoder();
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(decoder.decode(value, { stream: true }));
              }
              return chunks.join('');
            } finally {
              reader.releaseLock();
            }
          }
          return super.text();
        }
        
        async json() {
          if (this._bodyStream) {
            const text = await this.text();
            return JSON.parse(text);
          }
          return super.json();
        }
        
        async arrayBuffer() {
          if (this._bodyStream) {
            this.bodyUsed = true;
            const reader = this._bodyStream.getReader();
            const chunks = [];
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
              }
              
              // Combine chunks into single ArrayBuffer
              const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
              const result = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                result.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;
              }
              return result.buffer;
            } finally {
              reader.releaseLock();
            }
          }
          return super.arrayBuffer();
        }
      }
      
      return ResponseWithStream;
    });
  };

  setupPolyfills();
}

// Your existing app entry point
import 'expo-router/entry';