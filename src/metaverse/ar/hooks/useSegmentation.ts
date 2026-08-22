// ────────────────────────────────────────────────────────────
// src/metaverse/ar/hooks/useSegmentation.ts
// Loads MediaPipe SelfieSegmentation via CDN (on-device).
// Model weights (~6 MB) are cached after first load.
// ────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { loadScript } from '../utils';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747';

interface UseSegmentationParams {
  enabled?: boolean;
}

export function useSegmentation({ enabled = true }: UseSegmentationParams = {}) {
  const [isReady, setIsReady] = useState(false);
  const segRef = useRef<any>(null);
  // MediaPipe provides the mask as a canvas/image element in results
  const maskRef = useRef<CanvasImageSource | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        await loadScript(`${CDN}/selfie_segmentation.js`);
        if (cancelled) return;

        const seg = new (window as any).SelfieSegmentation({
          locateFile: (file: string) => `${CDN}/${file}`,
        });

        // modelSelection 1 = general model (better quality, slightly slower)
        seg.setOptions({ modelSelection: 1 });

        seg.onResults((results: any) => {
          sendingRef.current = false;
          if (results.segmentationMask) {
            maskRef.current = results.segmentationMask as CanvasImageSource;
          }
        });

        segRef.current = seg;
        if (!cancelled) setIsReady(true);
      } catch (err) {
        console.error('[useSegmentation] init error:', err);
      }
    })();

    return () => {
      cancelled = true;
      try { segRef.current?.close(); } catch { /* noop */ }
      segRef.current = null;
      sendingRef.current = false;
    };
  }, [enabled]);

  /**
   * Call once per render-loop iteration. Rate-limited: only sends a new
   * frame when the previous segmentation result has been received.
   */
  const sendFrame = (video: HTMLVideoElement) => {
    if (sendingRef.current || !segRef.current || !isReady) return;
    if (video.readyState < 2 || video.paused) return;
    sendingRef.current = true;
    segRef.current.send({ image: video }).catch(() => {
      sendingRef.current = false;
    });
  };

  return { isReady, maskRef, sendFrame };
}
