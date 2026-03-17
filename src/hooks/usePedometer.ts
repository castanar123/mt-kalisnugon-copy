import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface PedometerState {
  stepCount: number;
  isMoving: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * A sophisticated, offline-first pedometer hook using a low-pass filter and dynamic threshold.
 * This is similar to the algorithms used in native fitness apps like Pacer.
 */
export function usePedometer(): PedometerState {
  const [stepCount, setStepCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const sensorState = useRef({
    // Low-pass filter state
    lastX: 0, lastY: 0, lastZ: 0,
    // Dynamic threshold state
    magnitudeHistory: [] as number[],
    // Step detection state
    isPeak: false,
    lastStepTimestamp: 0,
  });

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const state = sensorState.current;

    // 1. Low-Pass Filter: Smooth out the raw sensor data to remove noise.
    const alpha = 0.8;
    const filteredX = alpha * state.lastX + (1 - alpha) * acc.x;
    const filteredY = alpha * state.lastY + (1 - alpha) * acc.y;
    const filteredZ = alpha * state.lastZ + (1 - alpha) * acc.z;
    state.lastX = filteredX; state.lastY = filteredY; state.lastZ = filteredZ;

    const magnitude = Math.sqrt(filteredX ** 2 + filteredY ** 2 + filteredZ ** 2);

    // 2. Dynamic Threshold Calculation
    state.magnitudeHistory.push(magnitude);
    if (state.magnitudeHistory.length > 50) { // ~1 second of data
      state.magnitudeHistory.shift();
    }

    const avgMagnitude = state.magnitudeHistory.reduce((a, b) => a + b, 0) / state.magnitudeHistory.length;
    const dynamicThreshold = avgMagnitude * 1.3; // Threshold is 30% above the recent average
    const STEP_THRESHOLD = 1.2; // Absolute minimum magnitude for a step
    const finalThreshold = Math.max(dynamicThreshold, STEP_THRESHOLD);

    // 3. Step Detection using Dynamic Threshold
    const now = Date.now();
    const MIN_STEP_INTERVAL = 350; // ms, prevents counting noise as multiple steps

    if (magnitude > finalThreshold && !state.isPeak) {
      state.isPeak = true;
    }
    
    if (magnitude < finalThreshold * 0.8 && state.isPeak) {
      state.isPeak = false;
      if (now - state.lastStepTimestamp > MIN_STEP_INTERVAL) {
        setStepCount(s => s + 1);
        state.lastStepTimestamp = now;
      }
    }

    // 4. Motion Gating (isMoving detection)
    const variance = state.magnitudeHistory.reduce((sum, val) => sum + (val - avgMagnitude) ** 2, 0) / state.magnitudeHistory.length;
    const MOTION_THRESHOLD = 0.5; // Stricter variance threshold for movement
    setIsMoving(variance > MOTION_THRESHOLD);

  }, []);

  const start = useCallback(() => {
    console.log('Starting Pedometer');
    // Request permission for motion sensors on iOS 13.3+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            setIsActive(true);
          } else {
            toast.warning('Motion sensor permission denied. Step counting will not work.');
          }
        })
        .catch((err) => {
          toast.error('Motion sensor access failed.');
          console.error(err);
        });
    } else {
      // Handle non-iOS 13.3+ devices
      window.addEventListener('devicemotion', handleMotion);
      setIsActive(true);
    }
  }, [handleMotion]);

  const stop = useCallback(() => {
    console.log('Stopping Pedometer');
    window.removeEventListener('devicemotion', handleMotion);
    setIsActive(false);
    setIsMoving(false);
  }, [handleMotion]);

  const reset = useCallback(() => {
    setStepCount(0);
    sensorState.current = {
      lastX: 0, lastY: 0, lastZ: 0,
      magnitudeHistory: [],
      isPeak: false,
      lastStepTimestamp: 0,
    };
  }, []);

  useEffect(() => {
    return () => stop(); // Cleanup on unmount
  }, [stop]);

  return { stepCount, isMoving, start, stop, reset };
}
