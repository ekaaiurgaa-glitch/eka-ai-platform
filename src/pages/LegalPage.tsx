import React from 'react';

const LegalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-black mb-8">Legal Information</h1>
        
        {/* Terms of Service */}
        <section id="terms" className="mb-12 border border-black rounded p-6">
          <h2 className="text-2xl font-bold text-brand-orange mb-4">Terms of Service</h2>
          <div className="space-y-4 text-black">
            <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h3>
            <p>
              By accessing and using the EKA-AI platform provided by Go4Garage Private Limited ("Company", "we", "us"), 
              you accept and agree to be bound by these Terms of Service.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">2. Service Description</h3>
            <p>
              EKA-AI is a Governed Automobile Intelligence System designed for automotive workshops, technicians, 
              and fleet managers. The platform provides diagnostic assistance, job card management, invoice generation, 
              and fleet management capabilities.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">3. User Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain confidentiality of account credentials</li>
              <li>Use the platform only for automobile-related business purposes</li>
              <li>Ensure accuracy of data entered into the system</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6">4. Pricing & Estimates</h3>
            <p>
              All pricing information provided by EKA-AI is for estimation purposes only. Final pricing is subject 
              to workshop approval and may vary based on actual parts availability and labor requirements.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">5. Limitation of Liability</h3>
            <p>
              Go4Garage Private Limited shall not be liable for any indirect, incidental, special, or consequential 
              damages arising from the use of the EKA-AI platform. Diagnostic suggestions are advisory only and 
              should be verified by qualified technicians.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">6. Subscription & Payment</h3>
            <p>
              Paid features require active subscription. Payments are processed through PayU. Subscription fees are 
              non-refundable except as required by law.
            </p>
          </div>
        </section>
        
        {/* Privacy Policy */}
        <section id="privacy" className="mb-12 border border-black rounded p-6">
          <h2 className="text-2xl font-bold text-brand-orange mb-4">Privacy Policy</h2>
          <div className="space-y-4 text-black">
            <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-xl font-semibold mt-6">1. Information We Collect</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email, name, phone number, workshop details</li>
              <li><strong>Vehicle Data:</strong> Registration numbers, make, model, service history</li>
              <li><strong>Usage Data:</strong> Queries, diagnostics, job cards, invoices</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6">2. How We Use Your Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve EKA-AI services</li>
              <li>Generate diagnostics and estimates</li>
              <li>Process invoices and payments</li>
              <li>Maintain audit logs for compliance</li>
              <li>Train and improve AI models</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6">3. Data Security</h3>
            <p>
              We implement industry-standard security measures including encryption, Row Level Security (RLS), 
              and secure authentication via Supabase. All data is stored in compliance with Indian data protection laws.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">4. Data Retention</h3>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. 
              Audit logs are retained for 7 years for compliance purposes.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">5. Your Rights</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Export your data</li>
              <li>Withdraw consent (may limit service availability)</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6">6. Third-Party Services</h3>
            <p>
              We use Supabase (database), Firebase (hosting), and PayU (payments). These services have their own 
              privacy policies and security measures.
            </p>
          </div>
        </section>
        
        {/* Dispute Resolution */}
        <section id="dispute" className="mb-12 border border-black rounded p-6">
          <h2 className="text-2xl font-bold text-brand-orange mb-4">Dispute Resolution</h2>
          <div className="space-y-4 text-black">
            <h3 className="text-xl font-semibold mt-6">1. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">2. Dispute Resolution Process</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Contact Support:</strong> Email support@go4garage.com with dispute details</li>
              <li><strong>Internal Review:</strong> We will review and respond within 7 business days</li>
              <li><strong>Mediation:</strong> If unresolved, parties agree to attempt mediation</li>
              <li><strong>Arbitration:</strong> Binding arbitration in Bangalore as final resort</li>
            </ol>
            
            <h3 className="text-xl font-semibold mt-6">3. Refund Policy</h3>
            <p>
              Subscription fees are non-refundable except in cases of service unavailability exceeding 72 hours 
              or as required by consumer protection laws.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">4. Contact Information</h3>
            <div className="bg-white border border-black rounded p-4 mt-4">
              <p><strong>Go4Garage Private Limited</strong></p>
              <p>Email: legal@go4garage.com</p>
              <p>Support: support@go4garage.com</p>
              <p>Phone: +91-XXXX-XXXXXX</p>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <div className="text-center text-sm text-black border-t border-black pt-6">
          <p>© {new Date().getFullYear()} Go4Garage Private Limited. All rights reserved.</p>
          <p className="mt-2">EKA-AI - Governed Automobile Intelligence</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
