import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useAtomValue } from 'jotai';
import { availableProvidersAtom } from '@/src/hooks/atoms';
import { transcribeAudio } from '@/src/services/sttService';
import { toastService } from '@/src/services/toastService';

interface MicButtonProps {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  className?: string;
}

export const MicButton: React.FC<MicButtonProps> = ({ onPartial, onFinal, className = '' }) => {
  const providers = useAtomValue(availableProvidersAtom);
  // const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop?.();
        recognitionRef.current.abort?.();
      }
    };
  }, []);

  const startWebRecognition = async () => {
    // @ts-ignore
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toastService.info({ title: 'Speech unavailable', description: 'Browser speech recognition is not supported.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim && onPartial) onPartial(interim);
      if (final && onFinal) {
        onFinal(final);
        stopWebRecognition();
        console.log("final", final);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      toastService.danger({ title: 'Speech error', description: String(e?.error || 'Unknown error') });
    };

    setIsListening(true);
    recognition.start();
  };

  const stopWebRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startNativeRecording = async () => {
    try {
      // const { status } = await Audio.requestPermissionsAsync();
      // if (status !== 'granted') {
      //   toastService.warning({ title: 'Microphone permission denied' });
      //   return;
      // }

      // await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      // const { recording } = await Audio.Recording.createAsync(
      //   Audio.RecordingOptionsPresets.HIGH_QUALITY
      // );
      // setRecording(recording);
      // setIsListening(true);
    } catch (e) {
      toastService.danger({ title: 'Recording error', description: String(e) });
    }
  };

  const stopNativeRecording = async () => {
    try {
      // TODO: get this updated to expo 54 Audio API
      // if (!recording) return;
      // await recording.stopAndUnloadAsync();
      // setIsListening(false);

      // const uri = recording.getURI();
      // setRecording(null);
      // if (!uri) return;

      // toastService.info({ title: 'Transcribing…' });
      // const text = await transcribeAudio({ fileUri: uri, providers });
      // if (text && onFinal) onFinal(text);
      // toastService.success({ title: 'Transcribed', description: text.slice(0, 120) + (text.length > 120 ? '…' : '') });

      // // Cleanup temporary file
      // try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    } catch (e) {
      setIsListening(false);
      toastService.danger({ title: 'Transcription error', description: String(e) });
    }
  };

  const onPress = async () => {
    if (Platform.OS === 'web') {
      if (isListening) stopWebRecognition(); else startWebRecognition();
    } else {
      if (isListening) await stopNativeRecording(); else await startNativeRecording();
    }
  };

  return (
    <Pressable onPress={onPress} className={`w-10 h-10 rounded-full ${isListening ? 'bg-red-500' : 'bg-surface'} hover:opacity-60 border border-border items-center justify-center ${className}`}>
      <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={22} className="!text-text" />
      {Platform.OS === 'web' && isListening ? null : null}
    </Pressable>
  );
}; 