import React from 'react';
import { Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    // 1. Call Backend to get Order ID
    // 2. Open Razorpay/Stripe Modal
    // 3. On Success -> Redirect
    alert("Payment Gateway Integration Pending (Add API Keys in Backend)");
  };

  return (
    <div className="flex-1 bg-[#131313] overflow-y-auto p-8 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Unlock Full Garage Potential</h1>
        <p className="text-text-secondary">Choose the engine that powers your growth.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Plan */}
        <div className="bg-[#191919] border border-border rounded-2xl p-8 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2">Mechanic</h3>
          <div className="text-3xl font-bold text-white mb-6">₹0 <span className="text-base font-normal text-text-secondary">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature text="5 Job Cards per month" />
            <Feature text="Basic Diagnostics" />
            <Feature text="Standard Invoicing" />
          </ul>
          
          <button className="w-full py-3 rounded-lg border border-border text-white hover:bg-[#252525] transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-[#2a1e15] to-[#191919] border border-brand-orange rounded-2xl p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
          <h3 className="text-xl font-semibold text-white mb-2">Workshop Pro</h3>
          <div className="text-3xl font-bold text-white mb-6">₹2,499 <span className="text-base font-normal text-text-secondary">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature text="Unlimited Job Cards" active />
            <Feature text="AI-Powered Diagnostics (Unlimited)" active />
            <Feature text="WhatsApp Integration" active />
            <Feature text="Inventory Management" active />
            <Feature text="Priority Support" active />
          </ul>
          
          <button 
            onClick={handleUpgrade}
            className="w-full py-3 rounded-lg bg-brand-orange text-white font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ text, active = false }: { text: string, active?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-brand-orange/20 text-brand-orange' : 'bg-[#252525] text-gray-500'}`}>
      <Check size={12} />
    </div>
    <span className={active ? 'text-white' : 'text-gray-400'}>{text}</span>
  </div>
);

export default PricingPage;
