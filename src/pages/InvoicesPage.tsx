import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Download, FileText, IndianRupee, 
  CheckCircle, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Printer
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  job_card_id: string;
  customer_name: string;
  customer_gstin?: string;
  tax_type: 'CGST_SGST' | 'IGST';
  total_taxable_value: number;
  total_tax_amount: number;
  grand_total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  due_date?: string;
  generated_at: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  item_type: 'PART' | 'LABOR' | 'MG_ADJUSTMENT';
  description: string;
  hsn_sac_code: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  taxable_value: number;
  tax_amount: number;
  total_amount: number;
}

const statusColors: Record<string, string> = {
  'DRAFT': 'bg-gray-100 text-gray-700',
  'SENT': 'bg-blue-100 text-blue-700',
  'PAID': 'bg-green-100 text-green-700',
  'OVERDUE': 'bg-red-100 text-red-700',
  'CANCELLED': 'bg-gray-200 text-gray-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  'DRAFT': <Clock className="w-4 h-4" />,
  'SENT': <FileText className="w-4 h-4" />,
  'PAID': <CheckCircle className="w-4 h-4" />,
  'OVERDUE': <AlertCircle className="w-4 h-4" />,
  'CANCELLED': <XCircle className="w-4 h-4" />,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      
      const response = await fetch(`/api/invoices?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const finalizeInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error finalizing invoice:', error);
    }
  };

  const markAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error marking invoice paid:', error);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage GST-compliant invoices and billing
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f18a22] text-white rounded-lg hover:bg-[#e07d1a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(invoices
              .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
              .reduce((sum, inv) => sum + inv.grand_total, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Paid This Month</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(invoices
              .filter(inv => inv.status === 'PAID')
              .reduce((sum, inv) => sum + inv.grand_total, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {invoices.filter(inv => inv.status === 'OVERDUE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Draft Invoices</p>
          <p className="text-2xl font-bold text-gray-600">
            {invoices.filter(inv => inv.status === 'DRAFT').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f18a22] focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No invoices found</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Invoice Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[invoice.status]}`}>
                    {statusIcons[invoice.status]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{invoice.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(invoice.grand_total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {invoice.tax_type === 'CGST_SGST' ? 'CGST/SGST' : 'IGST'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {invoice.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          finalizeInvoice(invoice.id);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Finalize
                      </button>
                    )}
                    {invoice.status === 'SENT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsPaid(invoice.id);
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPDF(invoice.id);
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {expandedInvoice === invoice.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedInvoice === invoice.id && (
                <div className="border-t border-gray-100 p-4">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h4>
                      <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                      {invoice.customer_gstin && (
                        <p className="text-sm text-gray-500">GSTIN: {invoice.customer_gstin}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Invoice Details</h4>
                      <p className="text-sm text-gray-600">
                        Generated: {new Date(invoice.generated_at).toLocaleDateString()}
                      </p>
                      {invoice.due_date && (
                        <p className="text-sm text-gray-600">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">HSN/SAC</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Rate</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">GST</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded mr-2">
                                {item.item_type}
                              </span>
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{item.hsn_sac_code}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-3 py-2 text-right">{item.gst_rate}%</td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatCurrency(item.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right font-medium">
                            Taxable Value:
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(invoice.total_taxable_value)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right font-medium">
                            Tax Amount:
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(invoice.total_tax_amount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right font-bold text-lg">
                            Grand Total:
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-lg text-[#f18a22]">
                            {formatCurrency(invoice.grand_total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
