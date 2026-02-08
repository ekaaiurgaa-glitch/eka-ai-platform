import React from 'react';
import { Check, Zap, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PricingPage = () => {
  
  const handlePayU = async () => {
    try {
      // 1. Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign in first");
        return;
      }

      // 2. Get Secure Hash & Payload from Backend
      const response = await fetch('/api/subscription/payu-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan_id: 'PRO' })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const data = await response.json();

      // 3. Create a hidden form dynamically
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action; // https://secure.payu.in/_payment

      // 4. Add all required PayU fields
      const fields = [
        'key', 'txnid', 'amount', 'productinfo', 
        'firstname', 'email', 'phone', 
        'surl', 'furl', 'hash'
      ];
      
      fields.forEach(field => {
        if (data[field]) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = field;
          input.value = data[field];
          form.appendChild(input);
        }
      });

      // 5. Auto-Submit to PayU
      document.body.appendChild(form);
      form.submit();

    } catch (err: any) {
      console.error("PayU Init Failed", err);
      alert("Could not initiate payment. Please contact support.");
    }
  };

  return (
    <div className="flex-1 bg-background overflow-y-auto p-8 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Unlock Full Garage Potential</h1>
        <p className="text-text-secondary">Choose the engine that powers your growth.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Plan */}
        <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col opacity-80 hover:opacity-100 transition-opacity">
          <h3 className="text-xl font-semibold text-white mb-2">Mechanic</h3>
          <div className="text-3xl font-bold text-white mb-6">₹0 <span className="text-base font-normal text-text-secondary">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <Feature text="5 Job Cards per month" />
            <Feature text="Basic Diagnostics" />
            <Feature text="Standard Invoicing" />
          </ul>
          
          <button className="w-full py-3 rounded-lg border border-border text-white hover:bg-[#333] transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-[#2a1e15] to-[#191919] border border-brand-orange rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-orange-900/20 transform hover:scale-105 transition-transform duration-300">
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
            onClick={handlePayU}
            className="w-full py-3 rounded-lg bg-brand-orange text-white font-semibold hover:bg-brand-hover transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={18} />
            Secure Payment with PayU
          </button>
          
          <p className="text-[10px] text-center mt-3 text-text-secondary">
            100% Secure Transaction via PayU India
          </p>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ text, active = false }: { text: string, active?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-brand-orange/20 text-brand-orange' : 'bg-[#333] text-gray-500'}`}>
      <Check size={12} />
    </div>
    <span className={active ? 'text-white' : 'text-gray-400'}>{text}</span>
  </div>
);

export default PricingPage;
