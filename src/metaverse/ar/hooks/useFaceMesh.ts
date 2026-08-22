// ────────────────────────────────────────────────────────────
// src/metaverse/ar/hooks/useFaceMesh.ts
// Loads MediaPipe FaceMesh via CDN (on-device, no server).
// Model weights (~8 MB) are cached by the browser after first load.
// ────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { loadScript, Landmark } from '../utils';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';

interface UseFaceMeshParams {
  enabled?: boolean;
}

export function useFaceMesh({ enabled = true }: UseFaceMeshParams = {}) {
  const [isReady, setIsReady] = useState(false);
  const faceMeshRef = useRef<any>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        await loadScript(`${CDN}/face_mesh.js`);
        if (cancelled) return;

        const fm = new (window as any).FaceMesh({
          locateFile: (file: string) => `${CDN}/${file}`,
        });

        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,   // faster; true adds iris landmarks
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        fm.onResults((results: any) => {
          sendingRef.current = false;
          landmarksRef.current = results.multiFaceLandmarks?.[0] ?? null;
        });

        faceMeshRef.current = fm;
        if (!cancelled) setIsReady(true);
      } catch (err) {
        console.error('[useFaceMesh] init error:', err);
      }
    })();

    return () => {
      cancelled = true;
      try { faceMeshRef.current?.close(); } catch { /* noop */ }
      faceMeshRef.current = null;
      sendingRef.current = false;
    };
  }, [enabled]);

  /**
   * Call this once per render-loop iteration to send the current video
   * frame to FaceMesh. It is rate-limited internally: a new frame is
   * only sent after the previous result has been received.
   */
  const sendFrame = (video: HTMLVideoElement) => {
    if (sendingRef.current || !faceMeshRef.current || !isReady) return;
    if (video.readyState < 2 || video.paused) return;
    sendingRef.current = true;
    faceMeshRef.current.send({ image: video }).catch(() => {
      sendingRef.current = false;
    });
  };

  return { isReady, landmarksRef, sendFrame };
}
