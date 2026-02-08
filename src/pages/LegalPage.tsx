import React from 'react';
import { useParams } from 'react-router-dom';

const LegalPage = () => {
  const { type } = useParams();

  const content: any = {
    privacy: {
      title: "Privacy Policy",
      text: "Go4Garage collects data to provide automotive intelligence. We do not sell your data..."
    },
    terms: {
      title: "Terms & Conditions",
      text: "By using EKA-AI, you agree to the following terms regarding SaaS usage and liability..."
    },
    refund: {
      title: "Refund Policy",
      text: "Subscriptions are non-refundable unless cancelled within 24 hours of purchase..."
    }
  };

  const current = content[type as string] || content.terms;

  return (
    <div className="min-h-screen bg-[#191919] text-gray-300 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-[#252525] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">{current.title}</h1>
        <div className="prose prose-invert">
          <p>{current.text}</p>
          <p className="mt-8 text-sm text-gray-500">Last updated: February 2026</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
