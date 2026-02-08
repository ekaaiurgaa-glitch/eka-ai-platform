import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, FileText, RotateCcw, Mail, MapPin, Building2 } from 'lucide-react';

// Company Details - Go4Garage Private Limited
const COMPANY_INFO = {
  name: "Go4Garage Private Limited",
  cin: "U72501MH2024PTC123456",  // Example CIN - update with actual
  gstin: "27AABCG1234D1Z5",       // Example GSTIN - update with actual
  address: "123, Techno Park, Andheri East, Mumbai - 400069, Maharashtra, India",
  email: "legal@eka-ai.com",
  phone: "+91-22-1234-5678",
  website: "https://eka-ai.com"
};

const LegalPage = () => {
  const { type } = useParams();

  const renderContent = () => {
    switch (type) {
      case 'privacy':
        return <PrivacyPolicy />;
      case 'refund':
        return <RefundPolicy />;
      case 'terms':
      default:
        return <TermsOfService />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-300">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#18181b]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-orange-500 hover:text-orange-400">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-white">EKA-AI</span>
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link to="/legal/terms" className={`hover:text-white ${type === 'terms' ? 'text-orange-500' : ''}`}>Terms</Link>
            <Link to="/legal/privacy" className={`hover:text-white ${type === 'privacy' ? 'text-orange-500' : ''}`}>Privacy</Link>
            <Link to="/legal/refund" className={`hover:text-white ${type === 'refund' ? 'text-orange-500' : ''}`}>Refund</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {renderContent()}
        
        {/* Company Footer */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              Company Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <p><span className="text-gray-500">Legal Name:</span> {COMPANY_INFO.name}</p>
                <p><span className="text-gray-500">CIN:</span> {COMPANY_INFO.cin}</p>
                <p><span className="text-gray-500">GSTIN:</span> {COMPANY_INFO.gstin}</p>
              </div>
              <div className="space-y-3">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  {COMPANY_INFO.address}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {COMPANY_INFO.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const TermsOfService = () => (
  <div className="space-y-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-gray-500">Last updated: February 8, 2026</p>
    </div>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
      <p>By accessing or using EKA-AI Platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). The Service is operated by Go4Garage Private Limited ("Company", "we", "us", or "our").</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
      <p>EKA-AI is a governed artificial intelligence platform for the automobile industry, providing:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>AI-powered vehicle diagnostics and repair recommendations</li>
        <li>Job card management and workflow automation</li>
        <li>Customer communication and approval systems</li>
        <li>Inventory and parts management</li>
        <li>Billing and GST-compliant invoicing</li>
        <li>Fleet management and Minimum Guarantee (MG) billing</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">3. Account Registration</h2>
      <p>To use the Service, you must:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Be at least 18 years of age</li>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Be a legally registered automobile workshop, service center, or related business</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">4. AI Governance & Limitations</h2>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <p className="text-orange-400 font-medium mb-2">⚠️ Important Disclaimer</p>
        <p className="text-sm">EKA-AI provides diagnostic assistance based on symptom patterns and technical databases. All AI recommendations:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
          <li>Are for informational purposes only</li>
          <li>Require verification by qualified technicians</li>
          <li>Do not replace professional mechanical judgment</li>
          <li>Final repair decisions are solely the workshop's responsibility</li>
        </ul>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">5. Subscription & Payments</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Services are billed on a subscription basis as per selected plan</li>
        <li>Payments are processed through PayU payment gateway</li>
        <li>GST (18%) is applicable as per Indian tax laws</li>
        <li>Subscription auto-renews unless cancelled 24 hours before renewal</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">6. Data Ownership & Privacy</h2>
      <p>You retain ownership of your customer and business data. We process data in accordance with our Privacy Policy and the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Go4Garage Private Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Use or inability to use the Service</li>
        <li>Reliance on AI-generated recommendations</li>
        <li>Unauthorized access to your data</li>
        <li>Any third-party conduct on the platform</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">8. Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">9. Contact</h2>
      <p>For any questions about these Terms, contact us at:</p>
      <p className="text-orange-400">legal@eka-ai.com</p>
    </section>
  </div>
);

const PrivacyPolicy = () => (
  <div className="space-y-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
        <Shield className="w-8 h-8 text-orange-500" />
        Privacy Policy
      </h1>
      <p className="text-gray-500">Last updated: February 8, 2026</p>
    </div>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
      <p>Go4Garage Private Limited ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the EKA-AI Platform.</p>
      <p className="text-orange-400">This policy is compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act) of India.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
      <h3 className="font-medium text-white">2.1 Personal Data</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>Name, email address, phone number</li>
        <li>Business registration details (GSTIN, Workshop license)</li>
        <li>Billing and payment information</li>
      </ul>
      
      <h3 className="font-medium text-white mt-4">2.2 Business Data</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>Customer vehicle information</li>
        <li>Job cards and service history</li>
        <li>Inventory and parts data</li>
        <li>AI diagnostic queries and results</li>
      </ul>

      <h3 className="font-medium text-white mt-4">2.3 Usage Data</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>Log data (IP address, browser type, pages visited)</li>
        <li>Device information</li>
        <li>AI interaction patterns (anonymized for improvement)</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Provide and maintain the EKA-AI Service</li>
        <li>Process AI diagnostics and generate recommendations</li>
        <li>Generate GST-compliant invoices</li>
        <li>Send service notifications and updates</li>
        <li>Improve AI models (using anonymized data only)</li>
        <li>Comply with legal obligations</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">4. Data Storage & Security</h2>
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-green-400 font-medium mb-2">🔒 Security Measures</p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Data stored in India (Mumbai region) - DPDP compliant</li>
          <li>End-to-end encryption (TLS 1.3)</li>
          <li>AES-256 encryption at rest</li>
          <li>Regular security audits</li>
          <li>Role-based access control (RBAC)</li>
        </ul>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">5. Your Rights (DPDP Act)</h2>
      <p>Under the DPDP Act, 2023, you have the following rights:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Right to Access:</strong> Request a copy of your data</li>
        <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
        <li><strong>Right to Withdraw Consent:</strong> Opt-out of data processing</li>
        <li><strong>Right to Grievance Redressal:</strong> Lodge complaints</li>
      </ul>
      <p className="mt-4">To exercise these rights, email us at <span className="text-orange-400">privacy@eka-ai.com</span></p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">6. Data Retention</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Active account data: Retained while account is active</li>
        <li>Deleted accounts: Data purged within 30 days (except audit logs)</li>
        <li>Financial records: Retained for 7 years as per tax laws</li>
        <li>AI training data: Anonymized immediately, no PII retained</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">7. Cookies & Tracking</h2>
      <p>We use cookies and similar technologies to enhance user experience. You can control cookie preferences through your browser settings.</p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
      <p>For privacy-related queries or to exercise your rights:</p>
      <div className="bg-[#18181b] rounded-lg p-4 mt-4">
        <p><strong>Data Protection Officer</strong></p>
        <p>Go4Garage Private Limited</p>
        <p>Email: privacy@eka-ai.com</p>
        <p>Address: 123, Techno Park, Andheri East, Mumbai - 400069</p>
      </div>
    </section>
  </div>
);

const RefundPolicy = () => (
  <div className="space-y-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
        <RotateCcw className="w-8 h-8 text-orange-500" />
        Refund Policy
      </h1>
      <p className="text-gray-500">Last updated: February 8, 2026</p>
    </div>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">1. Subscription Refunds</h2>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <p className="text-orange-400 font-medium mb-2">⚡ 24-Hour Cooling Off Period</p>
        <p className="text-sm">You may request a full refund within 24 hours of your initial subscription purchase, no questions asked.</p>
      </div>
      
      <h3 className="font-medium text-white mt-4">Refund Eligibility:</h3>
      <table className="w-full text-sm mt-2">
        <thead className="border-b border-white/10">
          <tr>
            <th className="text-left py-2">Scenario</th>
            <th className="text-left py-2">Refund</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          <tr className="border-b border-white/5">
            <td className="py-3">Within 24 hours of purchase</td>
            <td className="text-green-400">100%</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-3">Service unavailable &gt; 48 hours</td>
            <td className="text-green-400">Prorated</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-3">After 24 hours (normal use)</td>
            <td className="text-red-400">No refund</td>
          </tr>
          <tr>
            <td className="py-3">Annual plan (within 7 days)</td>
            <td className="text-yellow-400">50%</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">2. How to Request a Refund</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>Email <span className="text-orange-400">billing@eka-ai.com</span> with subject "Refund Request"</li>
        <li>Include your registered email and transaction ID</li>
        <li>State the reason for refund (helps us improve)</li>
        <li>Refunds processed within 5-7 business days</li>
      </ol>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">3. Refund Method</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Refunds are credited to the original payment method</li>
        <li>Bank account refunds may take 5-7 business days</li>
        <li>UPI refunds are typically processed within 24 hours</li>
        <li>GST component is also refunded proportionally</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">4. Cancellation</h2>
      <p>You can cancel your subscription at any time:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Go to Settings → Billing → Cancel Subscription</li>
        <li>Or email: <span className="text-orange-400">billing@eka-ai.com</span></li>
        <li>Access continues until end of billing period</li>
        <li>No partial refunds for unused days in current period</li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">5. Disputes</h2>
      <p>If you are unsatisfied with our refund decision, you may escalate to:</p>
      <p className="text-orange-400">grievance@eka-ai.com</p>
      <p className="text-sm text-gray-500 mt-2">We aim to resolve all disputes within 15 business days.</p>
    </section>
  </div>
);

export default LegalPage;
