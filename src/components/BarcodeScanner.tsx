import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Square, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precisionMode, setPrecisionMode] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!html5QrCodeRef.current) return;

    setError(null);
    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {} // silent error
      );
      
      // Find the video element created by html5-qrcode to use for snapshots
      const videoElement = document.querySelector('#reader video') as HTMLVideoElement;
      if (videoElement) {
        videoRef.current = videoElement;
      }
      
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
        videoRef.current = null;
      } catch (err) {
        console.error("Erro ao parar", err);
      }
    }
  }, []);

  const captureAndOcr = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Draw the current video frame to the canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 jpeg
      const imageData = canvas.toDataURL('image/jpeg', 0.85);

      const response = await fetch('/api/scan-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) throw new Error("Falha no processamento da imagem");

      const data = await response.json();
      
      if (data.vin && data.vin !== "NOT_FOUND") {
        onScan(data.vin);
        stopScanning();
      } else {
        setError("Não foi possível identificar o chassi. Tente aproximar mais ou melhorar a iluminação.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Erro ao processar imagem de alta precisão.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] overflow-hidden w-full max-w-md relative shadow-2xl"
      >
        <div className="p-6">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-8 pr-8">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Scanner de Precisão</h3>
            <p className="text-sm text-slate-500 mt-1">
              {precisionMode ? "Modo OCR Ativado: Capture uma foto nítida" : "Posicione o código ou texto no quadro"}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-950 aspect-video mb-8 shadow-inner group">
            <div id="reader" className="w-full h-full scale-[1.01]"></div>
            
            <AnimatePresence>
              {!isScanning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-white"
                >
                  <div className="p-5 rounded-full bg-white/10 backdrop-blur-md mb-4 border border-white/20">
                    <Camera className="w-10 h-10" />
                  </div>
                  <span className="text-sm font-medium tracking-wide">Câmera em espera</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanning Overlay UI */}
            {isScanning && !isProcessing && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-[40px] border-black/40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border-2 border-blue-400/50 rounded-2xl">
                  {/* Corner marks */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  
                  {/* Pulse line */}
                  <motion.div 
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="absolute inset-x-4 h-0.5 bg-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                  />
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Processando IA...</p>
                <p className="text-xs text-white/60 mt-1">Extraindo chassis com precisão</p>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-6 bottom-6 bg-red-500 text-white p-4 rounded-xl text-xs font-medium flex items-start gap-3 shadow-xl z-20 border border-white/20"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {!isScanning ? (
              <button 
                onClick={startScanning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 scale-100 active:scale-95"
              >
                <Camera className="w-6 h-6" />
                Ativar Câmera
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={captureAndOcr}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 active:scale-95"
                  title="Capturar imagem para leitura de alta precisão via IA"
                >
                  <Sparkles className="w-6 h-6" />
                  <span className="text-sm">Alta Precisão</span>
                </button>
                <button 
                  onClick={stopScanning}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
                >
                  <Square className="w-6 h-6 fill-current" />
                  <span className="text-sm">Parar</span>
                </button>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl transition-all border border-slate-200"
            >
              Fechar Scanner
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
