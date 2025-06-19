import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { proxyUrlAtom } from '@/src/hooks/atoms';
import {setProxyUrl} from '@/src/utils/proxy';

export function ProxyUrlSync() {
  const proxyUrlAtomValue = useAtomValue(proxyUrlAtom);

  useEffect(() => {

    // check that it works
    async function checkProxyUrl() {
      if(!proxyUrlAtomValue) return;
      
        let found = false;
        try {
            await fetch(proxyUrlAtomValue);
            found = true;
        } catch (error) {
            console.error('Proxy URL is not working', error);
        }

        setProxyUrl(found ? proxyUrlAtomValue : "");
    }

    checkProxyUrl();
  }, [proxyUrlAtomValue]);

  return null;
} 