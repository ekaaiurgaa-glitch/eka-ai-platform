import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EstimateData } from '../types';

interface CustomerApprovalGateProps {
  estimateData: EstimateData;
  jobCardId: string;
  customerPhone?: string;
  onApprove: () => void;
  onReject: () => void;
  onConcern: (message: string) => void;
  className?: string;
}

interface SignatureState {
  isDrawing: boolean;
  hasSignature: boolean;
}

const CustomerApprovalGate: React.FC<CustomerApprovalGateProps> = ({
  estimateData,
  jobCardId,
  customerPhone,
  onApprove,
  onReject,
  onConcern,
  className = '',
}) => {
  const [showQR, setShowQR] = useState(false);
  const [showConcernInput, setShowConcernInput] = useState(false);
  const [concernMessage, setConcernMessage] = useState('');
  const [signature, setSignature] = useState<SignatureState>({ isDrawing: false, hasSignature: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalToken] = useState(() => 
    `${jobCardId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
  
  // Price range variance for estimates (±10% as stated in legal notice)
  const PRICE_RANGE_VARIANCE = 0.10;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas for signature
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = '#f18a22';
      context.lineWidth = 2;
      contextRef.current = context;
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setSignature({ isDrawing: true, hasSignature: true });
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signature.isDrawing || !contextRef.current || !canvasRef.current) return;
    
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  }, [signature.isDrawing]);

  const stopDrawing = useCallback(() => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setSignature(prev => ({ ...prev, isDrawing: false }));
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setSignature({ isDrawing: false, hasSignature: false });
  }, []);

  const handleApprove = async () => {
    if (!signature.hasSignature) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onApprove();
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onReject();
    setIsProcessing(false);
  };

  const handleConcernSubmit = async () => {
    if (!concernMessage.trim()) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onConcern(concernMessage);
    setIsProcessing(false);
    setShowConcernInput(false);
    setConcernMessage('');
  };

  // Generate a simple QR-like pattern (in production, use a proper QR library)
  const generateQRPattern = () => {
    const size = 8;
    const pattern = [];
    for (let i = 0; i < size * size; i++) {
      pattern.push(Math.random() > 0.5);
    }
    return pattern;
  };

  const qrPattern = generateQRPattern();
  const approvalLink = `https://go4garage.app/approve/${approvalToken}`;

  // Calculate estimate summary
  const subtotal = estimateData.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxTotal = estimateData.items.reduce((sum, item) => {
    const lineTotal = item.unit_price * item.quantity;
    return sum + (lineTotal * item.gst_rate / 100);
  }, 0);
  const grandTotal = subtotal + taxTotal;

  return (
    <div className={`bg-[#050505] border-4 border-[#f18a22] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-6 bg-zinc-900/50 border-b-2 border-[#f18a22]/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-1">
              Customer Authorization Gate
            </span>
            <span className="text-[16px] font-black text-white font-mono uppercase">
              Estimate #{estimateData.estimate_id}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[9px] font-black text-yellow-500 uppercase font-mono tracking-wider">
              Awaiting Approval
            </span>
          </div>
        </div>
      </div>

      {/* Estimate Summary */}
      <div className="p-6 space-y-4 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-6 bg-[#f18a22]" />
          <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono">
            Cost Breakdown (Ranges)
          </span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {estimateData.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
              <div className="flex-1">
                <span className="text-[11px] text-zinc-300 font-mono">{item.description}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] text-zinc-600 font-mono">HSN: {item.hsn_code}</span>
                  <span className="text-[8px] text-zinc-600 font-mono">GST: {item.gst_rate}%</span>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#f18a22] font-mono">
                {item.price_range || `₹${(item.unit_price * (1 - PRICE_RANGE_VARIANCE)).toLocaleString()} - ₹${(item.unit_price * (1 + PRICE_RANGE_VARIANCE)).toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Subtotal (Est.)</span>
            <span className="text-zinc-300">₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-zinc-500">GST (Approx.)</span>
            <span className="text-zinc-300">₹{taxTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[14px] font-black font-mono pt-2 border-t border-zinc-800">
            <span className="text-zinc-400">Estimated Total</span>
            <span className="text-[#f18a22]">₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Approval Methods */}
      <div className="p-6 space-y-6">
        {/* QR Code / Link Section */}
        <div className="space-y-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">
              Share Approval Link
            </span>
            <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showQR ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showQR && (
            <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800 space-y-4">
              {/* Simple QR representation */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-white p-2 rounded-lg">
                  <div className="w-full h-full grid grid-cols-8 gap-0.5">
                    {qrPattern.map((filled, i) => (
                      <div key={i} className={`aspect-square ${filled ? 'bg-black' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-[9px] text-zinc-500 font-mono mb-2">Or share this link (expires in 24h):</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={approvalLink}
                    readOnly
                    className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1.5 text-[9px] font-mono text-zinc-400"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(approvalLink)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-mono hover:bg-zinc-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Digital Signature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">
              Digital Signature (Required)
            </span>
            {signature.hasSignature && (
              <button
                onClick={clearSignature}
                className="text-[9px] text-red-400 hover:text-red-300 font-mono"
              >
                Clear
              </button>
            )}
          </div>
          
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`w-full h-24 bg-zinc-900/50 rounded-lg border-2 cursor-crosshair ${
              signature.hasSignature ? 'border-[#f18a22]/50' : 'border-zinc-800 border-dashed'
            }`}
            style={{ touchAction: 'none' }}
          />
          
          {!signature.hasSignature && (
            <p className="text-[9px] text-zinc-600 font-mono text-center">
              Sign above to authorize this estimate
            </p>
          )}
        </div>

        {/* Concern Input */}
        {showConcernInput && (
          <div className="space-y-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <textarea
              value={concernMessage}
              onChange={(e) => setConcernMessage(e.target.value)}
              placeholder="Describe your concern..."
              className="w-full h-20 bg-black border border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-yellow-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConcernSubmit}
                disabled={!concernMessage.trim() || isProcessing}
                className="flex-1 py-2 bg-yellow-500 text-black rounded-lg text-[10px] font-black uppercase font-mono disabled:opacity-50"
              >
                Submit Concern
              </button>
              <button
                onClick={() => { setShowConcernInput(false); setConcernMessage(''); }}
                className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-bold font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="py-4 bg-red-500/10 border-2 border-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase font-mono hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => setShowConcernInput(true)}
            disabled={isProcessing || showConcernInput}
            className="py-4 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 rounded-xl text-[10px] font-black uppercase font-mono hover:bg-yellow-500/20 transition-all disabled:opacity-50"
          >
            Concern
          </button>
          <button
            onClick={handleApprove}
            disabled={!signature.hasSignature || isProcessing}
            className={`py-4 rounded-xl text-[10px] font-black uppercase font-mono transition-all disabled:opacity-50 ${
              signature.hasSignature 
                ? 'bg-green-500 text-black hover:bg-green-400' 
                : 'bg-zinc-800 text-zinc-600 border-2 border-zinc-700'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
        </div>

        {/* Legal Notice */}
        <p className="text-[8px] text-zinc-700 font-mono text-center leading-relaxed">
          By approving, you authorize Go4Garage to proceed with the repairs as estimated. 
          Final invoice may vary within ±10% of the estimate due to actual parts/labor costs.
        </p>
      </div>
    </div>
  );
};

export default CustomerApprovalGate;
