import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Download, FileText, Calculator } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceFormValues } from '../../../schemas/jobCardSchema';
import { z } from 'zod';
import { Invoice, InvoiceItem } from '../../../types/api.types';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';

interface InvoiceGeneratorProps {
  jobCardId: string;
  customerName: string;
  registrationNumber: string;
  existingInvoice?: Invoice | null;
  onGenerate: (data: InvoiceFormValues) => Promise<void>;
  onDownloadPDF?: (invoiceId: string) => Promise<void>;
  workshopState?: string;
  customerState?: string;
}

const GST_RATES = [0, 5, 12, 18, 28];
const ITEM_TYPES = [
  { value: 'PART', label: 'Part/Component' },
  { value: 'LABOR', label: 'Labor/Service' },
  { value: 'SERVICE', label: 'Additional Service' },
];

/**
 * InvoiceGenerator Component
 * 
 * A comprehensive invoice creation form with:
 * - Dynamic line items with GST calculation
 * - CGST/SGST for intra-state, IGST for inter-state
 * - Discount handling
 * - Real-time totals
 * - PDF generation capability
 */
const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  jobCardId,
  customerName,
  registrationNumber,
  existingInvoice,
  onGenerate,
  onDownloadPDF,
  workshopState = '27', // Default Maharashtra
  customerState = '27',
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isInterState = workshopState !== customerState;

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(z.object({
      customer_gstin: z.string().optional(),
      billing_address: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        hsn_code: z.string().optional(),
        type: z.enum(['PART', 'LABOR', 'SERVICE']),
        quantity: z.number(),
        unit_price: z.number(),
        discount_percent: z.number().optional(),
        gst_rate: z.number().optional(),
      })).min(1),
      discount_amount: z.number().optional(),
    })),
    defaultValues: {
      items: existingInvoice?.items.map(item => ({
        description: item.description,
        hsn_code: item.hsn_code || '',
        type: item.type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        gst_rate: item.gst_rate,
      })) || [
        {
          description: '',
          type: 'LABOR',
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
          gst_rate: 18,
        },
      ],
      discount_amount: existingInvoice?.discount_amount || 0,
      customer_gstin: existingInvoice?.customer_gstin || '',
      billing_address: existingInvoice?.billing_address || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount_amount') || 0;

  // Calculate totals
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    watchedItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const discountPct = Number(item.discount_percent) || 0;
      const gstRate = Number(item.gst_rate) || 0;

      const itemSubtotal = qty * price;
      const itemDiscount = (itemSubtotal * discountPct) / 100;
      const itemTaxable = itemSubtotal - itemDiscount;
      const itemGST = (itemTaxable * gstRate) / 100;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      taxableAmount += itemTaxable;

      if (isInterState) {
        totalIGST += itemGST;
      } else {
        totalCGST += itemGST / 2;
        totalSGST += itemGST / 2;
      }
    });

    const additionalDiscount = Number(watchedDiscount) || 0;
    taxableAmount -= additionalDiscount;

    const totalTax = isInterState ? totalIGST : totalCGST + totalSGST;
    const totalAmount = taxableAmount + totalTax;

    return {
      subtotal,
      totalDiscount: totalDiscount + additionalDiscount,
      taxableAmount,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
      totalTax,
      totalAmount,
    };
  }, [watchedItems, watchedDiscount, isInterState]);

  const handleGenerate = async (data: InvoiceFormValues) => {
    setIsGenerating(true);
    try {
      await onGenerate(data);
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const addItem = () => {
    append({
      description: '',
      type: 'LABOR',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      gst_rate: 18,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Invoice Generator</h2>
            <p className="text-sm text-gray-400 mt-1">
              For: {customerName} • {registrationNumber}
            </p>
          </div>
          {existingInvoice ? (
            <div className="flex items-center gap-3">
              <Badge variant="success">Invoice Generated</Badge>
              {onDownloadPDF && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => onDownloadPDF(existingInvoice.id)}
                >
                  Download PDF
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => setShowPreview(true)}
            >
              Preview & Generate
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Form */}
      {!existingInvoice && (
        <form className="p-6 space-y-6">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Customer GSTIN (Optional)
              </label>
              <input
                {...register('customer_gstin')}
                placeholder="27AABCU9603R1ZX"
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
              />
              {errors.customer_gstin && (
                <p className="text-red-400 text-xs mt-1">{String(errors.customer_gstin.message)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Tax Type
              </label>
              <div className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-300">
                {isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Billing Address
            </label>
            <textarea
              {...register('billing_address')}
              rows={2}
              placeholder="Enter billing address..."
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Line Items</h3>
              <Button variant="secondary" size="sm" onClick={addItem} leftIcon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 bg-black/30 border border-white/10 rounded-lg"
                >
                  <div className="grid grid-cols-12 gap-3">
                    {/* Description */}
                    <div className="col-span-4">
                      <input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <select
                        {...register(`items.${index}.type`)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 focus:outline-none focus:border-orange-500/50"
                      >
                        {ITEM_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty */}
                    <div className="col-span-1">
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 text-center focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <input
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 text-right focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                    {/* GST Rate */}
                    <div className="col-span-1">
                      <select
                        {...register(`items.${index}.gst_rate`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 focus:outline-none focus:border-orange-500/50"
                      >
                        {GST_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discount */}
                    <div className="col-span-1">
                      <input
                        {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Disc %"
                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-gray-200 text-center focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="mt-2 text-right text-sm text-gray-500">
                    Item Total:{' '}
                    {formatCurrency(
                      (watchedItems[index]?.quantity || 0) *
                        (watchedItems[index]?.unit_price || 0) *
                        (1 - (watchedItems[index]?.discount_percent || 0) / 100)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Discount */}
          <div className="flex items-center justify-end gap-4">
            <label className="text-sm text-gray-400">Additional Discount:</label>
            <input
              {...register('discount_amount', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="Amount"
              className="w-32 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 text-right focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </form>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Invoice Preview"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              Edit
            </Button>
            <Button
              variant="primary"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={handleSubmit(handleGenerate)}
              isLoading={isGenerating}
            >
              Generate Invoice
            </Button>
          </>
        }
      >
        <div className="bg-white text-gray-900 p-8 rounded-lg">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold">TAX INVOICE</h1>
              <p className="text-gray-600 mt-1">Job Card: {jobCardId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p className="text-sm text-gray-600">
                Invoice #: INV-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700">Bill To:</h3>
            <p className="text-lg">{customerName}</p>
            <p className="text-gray-600">Vehicle: {registrationNumber}</p>
            {watchedItems[0]?.hsn_code && (
              <p className="text-sm text-gray-500">GSTIN: {watchedItems[0].hsn_code}</p>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 text-sm">Description</th>
                <th className="text-center p-2 text-sm">Qty</th>
                <th className="text-right p-2 text-sm">Price</th>
                <th className="text-right p-2 text-sm">GST</th>
                <th className="text-right p-2 text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {watchedItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{item.description || 'Item ' + (idx + 1)}</td>
                  <td className="text-center p-2">{item.quantity}</td>
                  <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right p-2">{item.gst_rate}%</td>
                  <td className="text-right p-2">
                    {formatCurrency(
                      item.quantity * item.unit_price * (1 - item.discount_percent / 100) *
                        (1 + item.gst_rate / 100)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(calculations.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxable Amount:</span>
                  <span>{formatCurrency(calculations.taxableAmount)}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGST:</span>
                    <span>{formatCurrency(calculations.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST (9%):</span>
                      <span>{formatCurrency(calculations.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST (9%):</span>
                      <span>{formatCurrency(calculations.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">{formatCurrency(calculations.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Summary (for existing invoices) */}
      {existingInvoice && (
        <div className="p-6 bg-black/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Invoice Total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(existingInvoice.total_amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Status</p>
              <Badge variant={existingInvoice.status === 'PAID' ? 'success' : 'warning'}>
                {existingInvoice.status}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
