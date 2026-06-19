import { useState, useEffect } from 'react';

export interface GlobalTimer {
  startTime: number | null;
  duration: number;
  isRunning: boolean;
  recordedStartTime: string | null;
  recordedEndTime: string | null;
}

export const useGlobalTimer = () => {
  const [globalTimer, setGlobalTimer] = useState<GlobalTimer>(() => {
    const saved = localStorage.getItem('pdi_global_timer');
    return saved ? JSON.parse(saved) : { 
      startTime: null, 
      duration: 0, 
      isRunning: false,
      recordedStartTime: null,
      recordedEndTime: null
    };
  });

  useEffect(() => {
    localStorage.setItem('pdi_global_timer', JSON.stringify(globalTimer));
  }, [globalTimer]);

  const startGlobalTimer = () => {
    const currentTime = Date.now();
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setGlobalTimer(prev => ({
      ...prev,
      startTime: currentTime - (prev.duration * 60000),
      duration: prev.duration,
      isRunning: true,
      recordedStartTime: prev.recordedStartTime || timeStr,
      recordedEndTime: null
    }));
  };

  const stopGlobalTimer = () => {
    if (globalTimer.startTime) {
      const nowTime = Date.now();
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const diffMinutes = (nowTime - globalTimer.startTime) / 60000;
      setGlobalTimer(prev => ({
        ...prev,
        startTime: null,
        duration: diffMinutes,
        isRunning: false,
        recordedEndTime: timeStr
      }));
    }
  };

  const resetGlobalTimer = () => {
    setGlobalTimer({ 
      startTime: null, 
      duration: 0, 
      isRunning: false,
      recordedStartTime: null,
      recordedEndTime: null
    });
  };

  const getGlobalTime = () => {
    if (globalTimer.isRunning && globalTimer.startTime) {
      return (Date.now() - globalTimer.startTime) / 60000;
    }
    return globalTimer.duration;
  };

  return {
    globalTimer,
    setGlobalTimer,
    startGlobalTimer,
    stopGlobalTimer,
    resetGlobalTimer,
    getGlobalTime
  };
};
