import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useGlobalTimer } from '../hooks/useGlobalTimer';
import { calculateTotalTime, calculateIdleTime, calculateCapacity, calculateAverageTimePerCar } from '../utils/calculators';
import { getActivityTime } from '../utils/timeUtils';

export interface Activity {
  id: number;
  description: string;
  startTime: number | null;
  endTime: number | null;
  duration: number; // in minutes
  isRunning: boolean;
}

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: 1, description: 'Identificar Chassi - Chapelona', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 2, description: 'Colar Adesivo de Segurança', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 3, description: 'Adesivos Geral', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 4, description: 'Conferir Chave', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 5, description: 'Conferência MTA - Entrada', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 6, description: 'Conferência Rodopar', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 7, description: 'Passar Cola Chapelona', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 8, description: 'Colocar Suporte Placa', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 9, description: 'Tirar Cola Chapelona', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 10, description: 'Conferência MTA - Saida', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 11, description: 'Conferência TSL', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 12, description: 'Verificar Bateria', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 13, description: 'Movimentar Carro - Mirante', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 14, description: 'Colar Chapelona', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 15, description: 'Incluir Manual', startTime: null, endTime: null, duration: 0, isRunning: false },
  { id: 16, description: 'Colar Destrutiva', startTime: null, endTime: null, duration: 0, isRunning: false },
];

export interface MeasurementInfo {
  date: string;
  process: string;
  model: string;
  responsible: string;
  chassiInitial: string;
  chassiFinal: string;
  workday: number;
  queue: string;
  queueCarsCount: number;
}

interface PdiContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  measurementInfo: MeasurementInfo;
  setMeasurementInfo: React.Dispatch<React.SetStateAction<MeasurementInfo>>;
  isSaving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  historyItems: any[];
  scanningField: 'chassiInitial' | 'chassiFinal' | null;
  setScanningField: (val: 'chassiInitial' | 'chassiFinal' | null) => void;
  now: number;
  totalIdleMs: number;
  totalTime: number;
  leadTime: number;
  idleTime: number;
  capacity: number;
  averageTimePerCar: number;
  globalTimer: any;
  startGlobalTimer: () => void;
  stopGlobalTimer: () => void;
  resetGlobalTimer: () => void;
  getGlobalTime: () => number;
  startActivity: (id: number) => void;
  stopActivity: (id: number) => void;
  resetActivity: (id: number) => void;
  resetAll: () => void;
  handleScan: (data: string) => void;
  saveMeasurement: () => Promise<void>;
  deleteHistoryItem: (id: string) => void;
  clearAllHistory: () => void;
}

const PdiContext = createContext<PdiContextType | undefined>(undefined);

export const PdiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const { 
    globalTimer, 
    setGlobalTimer, 
    startGlobalTimer, 
    stopGlobalTimer, 
    resetGlobalTimer,
    getGlobalTime
  } = useGlobalTimer();

  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [measurementInfo, setMeasurementInfo] = useState<MeasurementInfo>({
    date: new Date().toLocaleDateString('pt-BR'),
    process: 'PDI Homo',
    model: '',
    responsible: '',
    chassiInitial: '',
    chassiFinal: '',
    workday: 403.8,
    queue: 'FILA 02',
    queueCarsCount: 10
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [scanningField, setScanningField] = useState<'chassiInitial' | 'chassiFinal' | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [totalIdleMs, setTotalIdleMs] = useState<number>(0);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('pdi_history');
    if (savedHistory) {
      try {
        setHistoryItems(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Update 'now' and 'totalIdleMs' every 100ms
  useEffect(() => {
    const isGlobalRunning = globalTimer.isRunning && globalTimer.startTime !== null;
    const isAnyActivityRunning = activities.some(a => a.isRunning);
    
    if (!isGlobalRunning && !isAnyActivityRunning) {
      lastTickRef.current = Date.now();
      return;
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const delta = currentTime - lastTickRef.current;
      
      setNow(currentTime);
      
      // If global timer is running BUT no activity is running, it's idle time
      if (isGlobalRunning && !isAnyActivityRunning) {
        setTotalIdleMs(prev => prev + delta);
      }
      
      lastTickRef.current = currentTime;
    }, 100);

    return () => clearInterval(interval);
  }, [activities, globalTimer.isRunning, globalTimer.startTime]);

  const startActivity = (id: number) => {
    const nowTime = Date.now();
    setNow(nowTime);
    lastTickRef.current = nowTime;

    if (!globalTimer.startTime && !globalTimer.isRunning && globalTimer.duration === 0) {
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setGlobalTimer(prev => ({
        ...prev,
        startTime: nowTime,
        duration: 0,
        isRunning: true,
        recordedStartTime: timeStr,
        recordedEndTime: null
      }));
    }

    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return { ...act, startTime: nowTime, endTime: null, isRunning: true };
      }
      return act;
    }));
  };

  const stopActivity = (id: number) => {
    const stopTime = Date.now();
    
    setActivities(prev => prev.map(act => {
      if (act.id === id && act.isRunning) {
        const durationMs = stopTime - (act.startTime || stopTime);
        const durationMin = durationMs / 60000;
        return { 
          ...act, 
          endTime: stopTime, 
          isRunning: false, 
          duration: Number((act.duration + durationMin).toFixed(4)) 
        };
      }
      return act;
    }));
  };

  const resetActivity = (id: number) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return { ...act, startTime: null, endTime: null, duration: 0, isRunning: false };
      }
      return act;
    }));
  };

  const resetAll = () => {
    setActivities(INITIAL_ACTIVITIES.map(a => ({ ...a, startTime: null, endTime: null, duration: 0, isRunning: false })));
    resetGlobalTimer();
    setTotalIdleMs(0);
    setMeasurementInfo({
      date: new Date().toLocaleDateString('pt-BR'),
      process: 'PDI Homo',
      model: '',
      responsible: '',
      chassiInitial: '',
      chassiFinal: '',
      workday: 403.8,
      queue: 'FILA 02',
      queueCarsCount: 10
    });
    const agora = Date.now();
    setNow(agora);
    lastTickRef.current = agora;
  };

  const handleScan = (data: string) => {
    if (scanningField) {
      setMeasurementInfo(prev => ({ ...prev, [scanningField]: data }));
      setScanningField(null);
    }
  };

  const totalTime = calculateTotalTime(activities, now, getActivityTime);
  const leadTime = getGlobalTime();
  const idleTime = calculateIdleTime(totalIdleMs);
  const capacity = calculateCapacity(totalTime, measurementInfo.workday);
  const averageTimePerCar = calculateAverageTimePerCar(totalTime, measurementInfo.queueCarsCount);

  const saveMeasurement = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const newEntry = {
        id: Date.now().toString(),
        ...measurementInfo,
        activities: activities.map(a => ({
          description: a.description,
          duration: Number(getActivityTime(a, now).toFixed(2)),
          etapa: a.id
        })),
        totalTime: Number(totalTime.toFixed(2)),
        leadTime: Number(leadTime.toFixed(2)),
        idleTime: Number(idleTime.toFixed(2)),
        capacity: Number(capacity.toFixed(2)),
        averageTimePerCar: Number(averageTimePerCar.toFixed(2)),
        recordedStartTime: globalTimer.recordedStartTime,
        recordedEndTime: globalTimer.recordedEndTime,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [newEntry, ...historyItems];
      localStorage.setItem('pdi_history', JSON.stringify(updatedHistory));
      setHistoryItems(updatedHistory);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHistoryItem = (id: string) => {
    if (window.confirm('Excluir este registro permanentemente?')) {
      const updatedHistory = historyItems.filter(item => item.id !== id);
      setHistoryItems(updatedHistory);
      localStorage.setItem('pdi_history', JSON.stringify(updatedHistory));
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Deseja apagar TODO o histórico? Esta ação é irreversível.')) {
      setHistoryItems([]);
      localStorage.removeItem('pdi_history');
    }
  };

  return (
    <PdiContext.Provider value={{
      isDarkMode,
      setIsDarkMode,
      activities,
      setActivities,
      measurementInfo,
      setMeasurementInfo,
      isSaving,
      saveStatus,
      showHistory,
      setShowHistory,
      historyItems,
      scanningField,
      setScanningField,
      now,
      totalIdleMs,
      totalTime,
      leadTime,
      idleTime,
      capacity,
      averageTimePerCar,
      globalTimer,
      startGlobalTimer,
      stopGlobalTimer,
      resetGlobalTimer,
      getGlobalTime,
      startActivity,
      stopActivity,
      resetActivity,
      resetAll,
      handleScan,
      saveMeasurement,
      deleteHistoryItem,
      clearAllHistory
    }}>
      {children}
    </PdiContext.Provider>
  );
};

export const usePdi = () => {
  const context = useContext(PdiContext);
  if (context === undefined) {
    throw new Error('usePdi must be used within a PdiProvider');
  }
  return context;
};
