import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, XCircle, AlertCircle, Car, 
  Phone, Calendar, FileText, IndianRupee,
  Loader2, Shield, Check
} from 'lucide-react';

interface JobCard {
  id: string;
  registration_number: string;
  status: string;
  symptoms: string[];
  diagnosis?: {
    possible_causes?: string[];
    recommended_actions?: string[];
  };
  estimate?: {
    items?: Array<{
      description: string;
      quantity: number;
      unit_price: number;
    }>;
    total_amount?: number;
  };
  created_at: string;
}

export default function PublicApprovalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [concernText, setConcernText] = useState('');
  const [showConcernForm, setShowConcernForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetchJobCard();
    } else {
      setError('Invalid or missing approval link');
      setLoading(false);
    }
  }, [token]);

  const fetchJobCard = async () => {
    try {
      const response = await fetch(`/api/public/job-card?token=${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load job card');
      }
      
      const data = await response.json();
      setJobCard(data.job_card);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'concern') => {
    setActionLoading(true);
    
    try {
      const response = await fetch('/api/approve-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          action,
          concern_notes: action === 'concern' ? concernText : undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      setActionSuccess(action);
      
      // Refresh job card
      if (action === 'approve' || action === 'reject') {
        setTimeout(() => {
          fetchJobCard();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#f18a22] mx-auto mb-4" />
          <p className="text-gray-600">Loading your job card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Please contact the workshop for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (actionSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            actionSuccess === 'approve' ? 'bg-green-100' :
            actionSuccess === 'reject' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <CheckCircle className={`w-8 h-8 ${
              actionSuccess === 'approve' ? 'text-green-600' :
              actionSuccess === 'reject' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {actionSuccess === 'approve' ? 'Job Approved!' :
             actionSuccess === 'reject' ? 'Job Rejected' : 'Concern Raised'}
          </h2>
          <p className="text-gray-600">
            {actionSuccess === 'approve' 
              ? 'Thank you for approving the work. We will proceed with the repairs.'
              : actionSuccess === 'reject'
              ? 'The job has been cancelled. Please contact the workshop for more information.'
              : 'Your concern has been noted. The workshop will contact you shortly.'}
          </p>
          {actionSuccess === 'approve' && (
            <p className="text-sm text-gray-500 mt-4">
              You can close this page now.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!jobCard) {
    return null;
  }

  const isApprovalState = jobCard.status === 'CUSTOMER_APPROVAL' || jobCard.status === 'ESTIMATED';
  const canApprove = isApprovalState;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#f18a22] rounded-t-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6" />
            <span className="text-sm font-medium opacity-90">Go4Garage Workshop</span>
          </div>
          <h1 className="text-2xl font-bold">Job Card Approval</h1>
          <p className="opacity-90 mt-1">
            Review and approve the repair estimate for your vehicle
          </p>
        </div>

        {/* Vehicle Info */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#f18a22]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car className="w-7 h-7 text-[#f18a22]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{jobCard.registration_number}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(jobCard.created_at).toLocaleDateString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  jobCard.status === 'CUSTOMER_APPROVED' ? 'bg-green-100 text-green-700' :
                  jobCard.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {jobCard.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#f18a22]" />
            Reported Symptoms
          </h3>
          <ul className="space-y-2">
            {jobCard.symptoms?.map((symptom, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 bg-[#f18a22] rounded-full mt-2 flex-shrink-0" />
                {symptom}
              </li>
            )) || (
              <li className="text-gray-500 italic">No symptoms recorded</li>
            )}
          </ul>
        </div>

        {/* Diagnosis */}
        {jobCard.diagnosis && (
          <div className="bg-white p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Diagnosis</h3>
            {jobCard.diagnosis.possible_causes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Possible Causes:</p>
                <ul className="space-y-1">
                  {jobCard.diagnosis.possible_causes.map((cause, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-[#f18a22]">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {jobCard.diagnosis.recommended_actions && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</p>
                <ul className="space-y-1">
                  {jobCard.diagnosis.recommended_actions.map((action, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Estimate */}
        {jobCard.estimate && (
          <div className="bg-white p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[#f18a22]" />
              Cost Estimate
            </h3>
            
            {jobCard.estimate.items && jobCard.estimate.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Rate</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobCard.estimate.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-gray-700">{item.description}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Detailed estimate not available</p>
            )}
            
            {jobCard.estimate.total_amount && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-medium text-gray-700">Estimated Total:</span>
                <span className="text-2xl font-bold text-[#f18a22]">
                  {formatCurrency(jobCard.estimate.total_amount)}
                </span>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              * This is an estimate. Final charges may vary based on actual work required.
            </p>
          </div>
        )}

        {/* Approval Actions */}
        {canApprove ? (
          <div className="bg-white rounded-b-xl p-6">
            {!showConcernForm ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Your Decision</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    Decline
                  </button>
                </div>
                
                <button
                  onClick={() => setShowConcernForm(true)}
                  disabled={actionLoading}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                  I have a question or concern
                </button>
              </>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Raise a Concern</h3>
                <textarea
                  value={concernText}
                  onChange={(e) => setConcernText(e.target.value)}
                  placeholder="Please describe your question or concern..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConcernForm(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction('concern')}
                    disabled={actionLoading || !concernText.trim()}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Concern'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-b-xl p-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">
                {jobCard.status === 'CUSTOMER_APPROVED' 
                  ? 'This job has been approved'
                  : jobCard.status === 'IN_PROGRESS'
                  ? 'Work is currently in progress'
                  : jobCard.status === 'CLOSED'
                  ? 'This job has been completed'
                  : 'This job is no longer awaiting approval'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                If you have any questions, please contact the workshop directly.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Powered by Go4Garage - Governed Automobile Intelligence</p>
        </div>
      </div>
    </div>
  );
}
