import React, { useState, useCallback } from 'react';
import { Check, X, Camera, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PDIChecklistItem, PDICategory, STANDARD_PDI_ITEMS } from '../../../types/api.types';
import { pdiCompletionSchema, PDICompletionFormValues } from '../../../schemas/jobCardSchema';
import Button from '../../shared/Button';
import Badge from '../../shared/Badge';
import Modal from '../../shared/Modal';

interface PDIChecklistProps {
  jobCardId: string;
  items: PDIChecklistItem[];
  onUpdateItem: (itemId: string, completed: boolean, notes?: string) => Promise<void>;
  onUploadEvidence: (itemId: string, file: File) => Promise<void>;
  onComplete: (declaration: string) => Promise<void>;
  isCompleted: boolean;
  technicianName?: string;
}

/**
 * PDIChecklist Component
 * 
 * An interactive 16-item Pre-Delivery Inspection checklist with:
 * - Pass/Fail toggles for each item
 * - Notes input for each item
 * - Evidence upload capability
 * - Category grouping
 * - Progress tracking
 * - Technician declaration for completion
 */
const PDIChecklist: React.FC<PDIChecklistProps> = ({
  jobCardId,
  items,
  onUpdateItem,
  onUploadEvidence,
  onComplete,
  isCompleted,
  technicianName,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<PDICategory>>(
    new Set(['EXTERIOR', 'INTERIOR', 'MECHANICAL', 'ELECTRICAL', 'SAFETY', 'DOCUMENTATION'])
  );
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  // Form for completion declaration
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PDICompletionFormValues>({
    resolver: zodResolver(pdiCompletionSchema),
    defaultValues: {
      technician_declaration: false,
      declaration_text: '',
    },
  });

  // Calculate progress
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const criticalItems = items.filter(item => item.is_critical);
  const criticalCompleted = criticalItems.every(item => item.completed);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<PDICategory, PDIChecklistItem[]>);

  const toggleCategory = (category: PDICategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleStatusToggle = async (item: PDIChecklistItem) => {
    await onUpdateItem(item.id, !item.completed, itemNotes[item.id]);
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const handleNoteBlur = async (item: PDIChecklistItem) => {
    const note = itemNotes[item.id];
    if (note !== undefined && note !== item.notes) {
      await onUpdateItem(item.id, item.completed, note);
    }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploadingItemId(itemId);
    try {
      await onUploadEvidence(itemId, file);
    } finally {
      setUploadingItemId(null);
    }
  };

  const onSubmitCompletion = async (data: PDICompletionFormValues) => {
    await onComplete(data.declaration_text);
    setShowCompleteModal(false);
  };

  const categoryLabels: Record<PDICategory, string> = {
    EXTERIOR: 'Exterior Inspection',
    INTERIOR: 'Interior Inspection',
    MECHANICAL: 'Mechanical Systems',
    ELECTRICAL: 'Electrical Systems',
    SAFETY: 'Safety Equipment',
    DOCUMENTATION: 'Documentation',
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header with Progress */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Pre-Delivery Inspection</h2>
            <p className="text-sm text-gray-400 mt-1">
              Job Card: <span className="text-orange-400">{jobCardId}</span>
            </p>
          </div>
          {isCompleted ? (
            <Badge variant="success" size="lg">Completed</Badge>
          ) : (
            <Badge variant={criticalCompleted ? 'warning' : 'error'} size="lg">
              {criticalCompleted ? 'In Progress' : 'Critical Items Pending'}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Inspection Progress</span>
            <span className="text-white font-medium">{completedCount}/{totalCount} items</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {!criticalCompleted && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              All critical items must be checked before completion
            </p>
          )}
        </div>
      </div>

      {/* Checklist Items by Category */}
      <div className="divide-y divide-white/5">
        {(Object.keys(groupedItems) as PDICategory[]).map((category) => (
          <div key={category}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-200">
                  {categoryLabels[category]}
                </span>
                <Badge variant="default" size="sm">
                  {groupedItems[category].filter(i => i.completed).length}/{groupedItems[category].length}
                </Badge>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Items */}
            {expandedCategories.has(category) && (
              <div className="px-4 pb-4 space-y-2">
                {groupedItems[category].map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      item.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Toggle */}
                      <button
                        onClick={() => handleStatusToggle(item)}
                        disabled={isCompleted}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-gray-500 hover:bg-white/20'
                        }`}
                      >
                        {item.completed ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-200">{item.task}</p>
                          {item.is_critical && (
                            <Badge variant="error" size="sm">Critical</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>

                        {/* Notes Input */}
                        {!isCompleted && (
                          <input
                            type="text"
                            placeholder="Add notes..."
                            value={itemNotes[item.id] ?? item.notes ?? ''}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            onBlur={() => handleNoteBlur(item)}
                            className="mt-2 w-full px-3 py-1.5 bg-black/30 border border-white/10 rounded text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                          />
                        )}
                        {isCompleted && item.notes && (
                          <p className="mt-2 text-sm text-gray-400 italic">Note: {item.notes}</p>
                        )}
                      </div>

                      {/* Evidence Upload */}
                      <div className="flex-shrink-0">
                        <label
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.has_evidence
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-white/5 text-gray-500 hover:bg-white/10'
                          } ${isCompleted ? 'pointer-events-none' : ''}`}
                        >
                          <Camera className="w-4 h-4" />
                          <span className="text-xs">
                            {uploadingItemId === item.id
                              ? 'Uploading...'
                              : item.has_evidence
                              ? 'Evidence Added'
                              : 'Add Evidence'}
                          </span>
                          {!isCompleted && (
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                            />
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complete Button */}
      {!isCompleted && (
        <div className="p-6 border-t border-white/10">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!criticalCompleted || completedCount < totalCount}
            onClick={() => setShowCompleteModal(true)}
          >
            Complete PDI Inspection
          </Button>
          {!criticalCompleted && (
            <p className="text-xs text-center text-red-400 mt-2">
              Complete all critical items before finishing
            </p>
          )}
        </div>
      )}

      {/* Completion Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete PDI Inspection"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmitCompletion)}
              isLoading={isSubmitting}
            >
              Confirm Completion
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-amber-400">
              By completing this inspection, you declare that all items have been 
              thoroughly checked and the vehicle is ready for delivery.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('technician_declaration')}
                className="w-5 h-5 rounded border-white/20 bg-black/30 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-gray-300">
                I confirm all items have been inspected
              </span>
            </label>
            {errors.technician_declaration && (
              <p className="text-red-400 text-sm mt-1 ml-8">
                {errors.technician_declaration.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Technician Declaration
            </label>
            <textarea
              {...register('declaration_text')}
              rows={3}
              placeholder="Enter your declaration statement..."
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
            {errors.declaration_text && (
              <p className="text-red-400 text-sm mt-1">
                {errors.declaration_text.message}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            This declaration will be recorded and associated with your account
            ({technicianName || 'Current User'}).
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default PDIChecklist;
