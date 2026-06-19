/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  History, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Timer,
  Car,
  User,
  ClipboardList,
  QrCode,
  FileDown,
  Trash2,
  X,
  Sun,
  Moon,
  Smartphone,
  Share,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeScanner } from './components/BarcodeScanner';
import { formatTime, getActivityTime } from './utils/timeUtils';
import { generatePDF } from './services/pdfService';
import { PdiProvider, usePdi } from './context/PdiContext';

function PdiApp() {
  const {
    isDarkMode,
    setIsDarkMode,
    activities,
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
    totalTime,
    leadTime,
    idleTime,
    capacity,
    averageTimePerCar,
    globalTimer,
    startGlobalTimer,
    stopGlobalTimer,
    startActivity,
    stopActivity,
    resetActivity,
    resetAll,
    handleScan,
    saveMeasurement,
    deleteHistoryItem,
    clearAllHistory,
    getGlobalTime
  } = usePdi();

  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [showInstallModal, setShowInstallModal] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    // Verificar se já está rodando como aplicativo instalado (standalone)
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detectar dispositivo iOS (Safari não suporta beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Se já foi capturado previamente por index.html
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      if (!checkStandalone) {
        setShowInstallBanner(true);
      }
    }

    // Capturar o evento no Android/Chrome/Edge
    const handleBeforeInstallPrompt = (e: any) => {
      // Deixamos o Chrome exibir o mini-infobar nativo automaticamente. Não chamamos e.preventDefault()
      setDeferredPrompt(e);
      // Não exibimos o banner customizado no Android, pois o nativo já vai aparecer
    };

    const handleCustomPromptEvent = (e: any) => {
      // Fallback
      if (e.detail) {
        setDeferredPrompt(e.detail);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handleCustomPromptEvent as EventListener);

    // Em iOS Safari se não estiver instalado, exibimos instruções dedicadas
    if (isIosDevice && !checkStandalone) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handleCustomPromptEvent as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleGeneratePDF = (item?: any) => {
    const data = item || {
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
      recordedEndTime: globalTimer.recordedEndTime
    };
    generatePDF(data);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-12`}>
      {/* Navbar */}
      <header className={`sticky top-0 z-30 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">PDI Homo</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={resetAll}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors font-medium text-sm ${isDarkMode ? 'border-slate-700 hover:bg-red-500/10 text-slate-400 hover:text-red-400' : 'border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500'}`}
              title="Zerar Processo Atual"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors font-medium text-sm ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Banner de Instalação PWA */}
        <AnimatePresence>
          {showInstallBanner && !isStandalone && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 rounded-2xl p-5 border relative overflow-hidden transition-all shadow-md ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-blue-500/30 text-slate-100' 
                  : 'bg-blue-50 border-blue-100 text-slate-800'
              }`}
            >
              <button 
                onClick={() => setShowInstallBanner(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-200/20 transition-all ${
                  isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Fechar recomendação"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${
                  isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                
                <div className="flex-grow pr-6">
                  <h3 className="font-bold text-sm sm:text-base mb-1">
                    Instalar Aplicativo no Celular
                  </h3>
                  <p className={`text-xs leading-relaxed mb-3 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Adicione o aplicativo <strong>PDI Homo</strong> à tela inicial do seu celular para acesso instantâneo, visualização em tela cheia e maior desempenho operacional.
                  </p>

                  {isIOS ? (
                    <div className={`text-xs rounded-xl p-3 border space-y-1.5 ${
                      isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-white border-blue-200/60 text-slate-700'
                    }`}>
                      <p className="font-semibold flex items-center gap-1.5 text-blue-500">
                        Como instalar no iPhone/iPad (iOS):
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>
                          Toque no ícone de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline mx-0.5" /> (na barra inferior ou superior do Safari).
                        </li>
                        <li>
                          Role a lista de opções para baixo e toque em <strong>Instalar</strong> ou <strong>Adicionar à Tela de Início</strong>.
                        </li>
                        <li>
                          Confirme tocando em <strong>Adicionar</strong> no canto superior direito.
                        </li>
                      </ol>
                    </div>
                  ) : deferredPrompt ? (
                    <button 
                      onClick={handleInstallClick}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      Instalar Aplicativo
                    </button>
                  ) : (
                    <div className={`text-xs rounded-xl p-3 border space-y-1.5 ${
                      isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-white border-blue-200/60 text-slate-700'
                    }`}>
                      <p className="font-semibold flex items-center gap-1.5 text-blue-500">
                        Como instalar no Android/Chrome:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>
                          Toque nos <strong>três pontinhos (menu)</strong> no canto superior direito do Chrome.
                        </li>
                        <li>
                          Selecione <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Fields */}
          <section className="lg:col-span-1 space-y-6">
            <div className={`rounded-2xl shadow-sm border p-6 h-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Informações Gerais</h2>
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Processo</label>
                  <input 
                    type="text" 
                    value={measurementInfo.process}
                    readOnly
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Modelo de Veículo</label>
                  <div className="relative">
                    <Car className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                    <select 
                      value={measurementInfo.model}
                      onChange={e => setMeasurementInfo(prev => ({ ...prev, model: e.target.value }))}
                      className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                    >
                      <option value="">Selecione o modelo</option>
                      <option value="Omoda">Omoda</option>
                      <option value="Jaecoo">Jaecoo</option>
                      <option value="Jetour">Jetour</option>
                      <option value="Territory">Territory</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Responsável</label>
                  <div className="relative">
                    <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      placeholder="Nome do medidor"
                      value={measurementInfo.responsible}
                      onChange={e => setMeasurementInfo(prev => ({ ...prev, responsible: e.target.value }))}
                      className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fila de Produção</label>
                  <select 
                    value={measurementInfo.queue}
                    onChange={e => setMeasurementInfo(prev => ({ ...prev, queue: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                  >
                    <option value="FILA 01">Fila 01</option>
                    <option value="FILA 02">Fila 02</option>
                    <option value="FILA 03">Fila 03</option>
                    <option value="FILA 04">Fila 04</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Qtd. de Carros na Fila</label>
                  <select 
                    value={measurementInfo.queueCarsCount}
                    onChange={e => setMeasurementInfo(prev => ({ ...prev, queueCarsCount: Number(e.target.value) }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                      <option key={num} value={num}>
                        {num} carros {num === 9 || num === 10 ? '(Padrão)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`space-y-4 pt-2 border-t transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block uppercase tracking-wider transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Chassi Inicial</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={measurementInfo.chassiInitial}
                        onChange={e => setMeasurementInfo(prev => ({ ...prev, chassiInitial: e.target.value }))}
                        className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50/50 border-slate-100 focus:border-blue-500 focus:bg-white'}`}
                        placeholder="Escaneie ou digite o chassi"
                      />
                      <button 
                        onClick={() => setScanningField('chassiInitial')}
                        className={`p-3 rounded-xl transition-all shadow-sm ${isDarkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        title="Escanear Código"
                      >
                        <QrCode className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block uppercase tracking-wider transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Chassi Final</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={measurementInfo.chassiFinal}
                        onChange={e => setMeasurementInfo(prev => ({ ...prev, chassiFinal: e.target.value }))}
                        className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-slate-50/50 border-slate-100 focus:border-blue-500 focus:bg-white'}`}
                        placeholder="Escaneie ou digite o chassi"
                      />
                      <button 
                        onClick={() => setScanningField('chassiFinal')}
                        className={`p-3 rounded-xl transition-all shadow-sm ${isDarkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        title="Escanear Código"
                      >
                        <QrCode className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Activities List */}
          <section className="lg:col-span-2 space-y-4">
            {/* Global Timer Control */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
              globalTimer.isRunning 
                ? (isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-100') 
                : (isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm')
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Timer className={`w-5 h-5 ${globalTimer.isRunning ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
                </div>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tempo Total de Operação</h3>
                  <div className="flex items-baseline gap-2">
                    <div className="font-mono text-2xl font-black tabular-nums tracking-tighter">
                      {formatTime(getGlobalTime())}
                    </div>
                    {(globalTimer.recordedStartTime || globalTimer.recordedEndTime) && (
                      <div className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {globalTimer.recordedStartTime}
                        {globalTimer.recordedEndTime && ` - ${globalTimer.recordedEndTime}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={globalTimer.isRunning ? stopGlobalTimer : startGlobalTimer}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                  globalTimer.isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {globalTimer.isRunning ? (
                  <>
                    <X className="w-5 h-5" />
                    <span>Finalizar Fila</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Operação</span>
                  </>
                )}
              </button>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <h2 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  Cronometragem de Atividades
                </h2>
                <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border italic transition-colors duration-300 ${isDarkMode ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                  {measurementInfo.queue}
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                {activities.map((activity) => {
                  const isCompleted = activity.duration > 0 && !activity.isRunning;
                  const time = formatTime(getActivityTime(activity, now));
                  
                  return (
                    <div key={activity.id} className="flex items-center gap-2">
                      {/* ID Indicator */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                        activity.isRunning 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                            : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400')
                      }`}>
                        <span className="text-[10px] font-bold">{activity.id}</span>
                      </div>

                      {/* Main Action Button */}
                      <button
                        onClick={() => activity.isRunning ? stopActivity(activity.id) : startActivity(activity.id)}
                        className={`flex-1 group relative flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 overflow-hidden ${
                          activity.isRunning 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[0.98]' 
                            : isCompleted
                              ? (isDarkMode ? 'bg-emerald-600/90 text-white' : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10')
                              : (isDarkMode 
                                ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30')
                        }`}
                      >
                        {/* Glass Shine effect for active/completed */}
                        {(activity.isRunning || isCompleted) && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                        )}

                        <div className="flex flex-col items-start relative z-10">
                          <span className={`${isCompleted ? 'text-xs opacity-90' : 'text-sm'} tracking-tight transition-all`}>
                            {activity.description}
                          </span>
                          {isCompleted && !activity.isRunning && (
                            <span className="text-[8px] opacity-70 font-medium uppercase tracking-widest leading-none mt-0.5">Concluído</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 relative z-10 shrink-0">
                          <span className={`font-mono text-sm tabular-nums tracking-tighter ${
                            activity.isRunning || isCompleted ? 'text-white' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {time}
                          </span>
                          
                          {activity.isRunning ? (
                            <div className="relative flex items-center justify-center">
                              <motion.div 
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute w-4 h-4 rounded-full bg-white/40"
                              />
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Play className={`w-3.5 h-3.5 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                          )}
                        </div>
                      </button>

                      {/* Reset Button (only shows if progress exists) */}
                      {(activity.startTime !== null || activity.duration > 0) && (
                        <button 
                          onClick={() => resetActivity(activity.id)}
                          className={`p-3 rounded-xl transition-all shrink-0 ${
                            isDarkMode 
                              ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' 
                              : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="Zerar Atividade"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Summary Card - Enhanced with Operation Time, Idle Time and Average Time per Car */}
          <section className="lg:col-span-3">
            <div className={`rounded-3xl shadow-2xl p-8 text-white overflow-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900'}`}>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                
                <div>
                  <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Tempo de Operação</h2>
                  <p className="text-4xl font-bold font-mono tracking-tighter text-blue-400">
                    {formatTime(leadTime)} <span className="text-sm font-normal text-slate-600">min</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${globalTimer.isRunning ? 'bg-green-500 animate-pulse' : (globalTimer.duration > 0 ? 'bg-slate-500' : 'bg-slate-700')}`}></span>
                    {globalTimer.isRunning ? 'Em andamento' : (globalTimer.duration > 0 ? 'Finalizado' : 'Aguardando início')}
                  </p>
                </div>

                <div className="md:border-l md:border-slate-800 md:pl-8">
                  <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Total das Atividades</h2>
                  <p className="text-4xl font-bold font-mono tracking-tighter">
                    {formatTime(totalTime)} <span className="text-sm font-normal text-slate-600">min</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">Soma individual das tarefas</p>
                </div>

                <div className="lg:border-l lg:border-slate-800 lg:pl-8">
                  <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Tempo Médio / Carro</h2>
                  <p className="text-4xl font-bold font-mono tracking-tighter text-emerald-400">
                    {formatTime(averageTimePerCar)} <span className="text-sm font-normal text-slate-600">min</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">Para {measurementInfo.queueCarsCount} carros na fila</p>
                </div>

                <div className="lg:border-l lg:border-slate-800 lg:pl-8">
                  <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Tempo Ocioso</h2>
                  <p className={`text-4xl font-bold font-mono tracking-tighter ${idleTime > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {formatTime(idleTime)} <span className="text-sm font-normal text-slate-600">min</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">Diferença/Espera (Lead - Soma)</p>
                </div>

                <div className="lg:border-l lg:border-slate-800 lg:pl-8">
                  <button 
                    onClick={saveMeasurement}
                    disabled={isSaving || (totalTime === 0 && leadTime === 0)}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      {isSaving ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : saveStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span className="text-lg">Salvar</span>
                    </div>
                  </button>

                  <p className="text-center text-[9px] text-slate-600 mt-3 font-medium uppercase tracking-[0.15em]">Capacidade: {capacity.toFixed(1)} veíc/dia</p>
                </div>

              </div>
              <div className="absolute -right-12 -bottom-12 opacity-[0.03]">
                <Clock className="w-64 h-64" />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* History Drawer Overlay */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 bottom-0 w-full max-w-sm shadow-2xl z-50 overflow-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'}`}
            >
              <div className={`px-6 py-6 border-b flex items-center justify-between transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Histórico de Medições</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Sessões salvas neste navegador</p>
                </div>
                <div className="flex items-center gap-2">
                  {historyItems.length > 0 && (
                    <button 
                      onClick={clearAllHistory}
                      className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-red-400/10 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                      title="Limpar Tudo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowHistory(false)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-500'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <History className={`w-12 h-12 mb-4 opacity-20 ${isDarkMode ? 'text-slate-100' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma medição encontrada no seu histórico local.</p>
                  </div>
                ) : (
                  historyItems.map((item: any) => (
                    <div key={item.id} className={`rounded-xl p-4 border transition-all group relative ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-blue-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{item.date}</span>
                        <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{formatTime(item.totalTime)}</span>
                      </div>
                      <h4 className={`text-sm font-bold line-clamp-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.model || 'Modelo não informado'}</h4>
                      <div className={`mt-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        <User className="w-3 h-3" />
                        <span className="text-[10px]">{item.responsible || 'Sem responsável'}</span>
                      </div>
                      <div className={`mt-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        <Car className="w-3 h-3" />
                        <span className="text-[10px]">Chassi: {item.chassiInitial || '-'} / {item.chassiFinal || '-'}</span>
                      </div>
                      
                      <div className={`mt-2 flex items-center justify-between border-t pt-2 gap-2 ${isDarkMode ? 'border-slate-700/50 text-slate-400' : 'border-slate-200/60 text-slate-500'}`}>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-wider opacity-70">Total Fila</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.queueCarsCount || 10} carros</span>
                        </div>
                        <div className="flex flex-col items-end pr-16 animate-pulse">
                          <span className="text-[8px] uppercase tracking-wider opacity-70">Tempo Médio / Carro</span>
                          <span className="text-[10px] font-bold text-emerald-500 font-mono">{formatTime(item.averageTimePerCar !== undefined ? item.averageTimePerCar : (item.queueCarsCount ? (item.totalTime / item.queueCarsCount) : (item.totalTime / 10)))}</span>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(item);
                          }}
                          className={`p-2 rounded-lg border transition-all shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-blue-400 hover:border-blue-900' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
                          title="Baixar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className={`p-2 rounded-lg border transition-all shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-900' : 'bg-white border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200'}`}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Instalação PWA */}
      <AnimatePresence>
        {showInstallModal && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[99]"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md rounded-2xl shadow-2xl z-[100] overflow-hidden border p-6 flex flex-col transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setShowInstallModal(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-200/20 transition-all ${
                  isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Icon display */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-900 flex items-center justify-center">
                    <img 
                      src="/pdi_app_icon_1781712661725.png" 
                      alt="Ícone PDI Homo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-extrabold text-xl mb-1">
                  PDI Homo
                </h3>
                <p className={`text-xs mb-6 px-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Instale o aplicativo ideal de vistoria PDI no seu celular ou computador para acesso offline e melhor desempenho.
                </p>
                
                {/* OS Flow */}
                <div className="w-full space-y-4">
                  {deferredPrompt ? (
                    <div className="space-y-3">
                      <button 
                        onClick={async () => {
                          await handleInstallClick();
                          setShowInstallModal(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer hover:shadow-xl transition-all active:scale-95"
                      >
                        <Smartphone className="w-5 h-5" />
                        Instalar no Celular Agora
                      </button>
                      <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Compatível com seu sistema Android/Chrome. Clique acima para concluir.
                      </p>
                    </div>
                  ) : isIOS ? (
                    <div className="space-y-3 text-left">
                      <div className={`text-xs rounded-xl p-4 border space-y-2.5 ${
                        isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <p className="font-bold flex items-center gap-1.5 text-blue-500">
                          <Share className="w-4 h-4" />
                          Instalação no iPhone (iOS Safari):
                        </p>
                        <ol className="list-decimal list-inside space-y-2 pl-1 text-[11px] leading-relaxed">
                          <li>
                            Toque no botão central de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> na barra inferior ou superior do Safari.
                          </li>
                          <li>
                            Role as opções de compartilhamento e selecione a opção de <strong>Adicionar à Tela de Início</strong>.
                          </li>
                          <li>
                            Toque em <strong>Adicionar</strong> no canto superior direito para confirmar e concluir.
                          </li>
                        </ol>
                      </div>
                      <p className={`text-[10px] text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Pronto! O aplicativo será adicionado na tela do seu dispositivo com o novo ícone.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className={`text-[11px] p-3 rounded-xl border flex items-start gap-2 ${
                        isDarkMode ? 'bg-amber-950/30 border-amber-900/50 text-amber-200/80' : 'bg-amber-50 border-amber-200 text-amber-700/80'
                      }`}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-xs uppercase tracking-wide">Instalação Bloqueada</p>
                          <p>Isso acontece se você já instalou o app antes, está usando aba anônima ou está visualizando dentro da plataforma de testes.</p>
                        </div>
                      </div>

                      {window.self !== window.top ? (
                        <div className="space-y-2">
                          <p className={`text-xs text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Para liberar a instalação, abra o app em tela cheia:</p>
                          <a 
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer hover:shadow-xl transition-all active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir em Nova Aba
                          </a>
                        </div>
                      ) : (
                        <div className={`text-xs rounded-xl p-4 border space-y-2.5 ${
                          isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <p className="font-bold flex items-center gap-1.5 text-blue-500">
                            Método de Instalação Manual:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11.5px] leading-relaxed">
                            <li>
                              Toque no <strong>menu de três pontinhos</strong> no canto superior direito do seu navegador.
                            </li>
                            <li>
                              Escolha a opção <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.
                            </li>
                            <li>
                              Confirme no diálogo para salvar o atalho com o novo ícone do carro na sua tela inicial!
                            </li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => setShowInstallModal(false)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                      isDarkMode 
                        ? 'border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100' 
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Voltar para o PDI Homo
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scanningField && (
          <BarcodeScanner 
            onScan={handleScan}
            onClose={() => setScanningField(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <PdiProvider>
      <PdiApp />
    </PdiProvider>
  );
}

