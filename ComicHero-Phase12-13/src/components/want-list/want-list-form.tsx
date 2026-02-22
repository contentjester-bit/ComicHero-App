"use client";

import { useState, FormEvent } from "react";

interface WantListFormProps {
  onSubmit: (
    volumeName: string,
    issueNumber: string,
    targetMaxPrice: number,
    notes?: string
  ) => Promise<void>;
  onCancel?: () => void;
  initialValues?: {
    volumeName?: string;
    issueNumber?: string;
    targetMaxPrice?: number;
    notes?: string;
  };
}

export function WantListForm({
  onSubmit,
  onCancel,
  initialValues,
}: WantListFormProps) {
  const [volumeName, setVolumeName] = useState(
    initialValues?.volumeName || ""
  );
  const [issueNumber, setIssueNumber] = useState(
    initialValues?.issueNumber || ""
  );
  const [targetMaxPrice, setTargetMaxPrice] = useState(
    initialValues?.targetMaxPrice?.toString() || ""
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!volumeName.trim() || !issueNumber.trim() || !targetMaxPrice) return;
    setSubmitting(true);
    try {
      await onSubmit(
        volumeName.trim(),
        issueNumber.trim(),
        parseFloat(targetMaxPrice),
        notes.trim() || undefined
      );
      // Reset form
      setVolumeName("");
      setIssueNumber("");
      setTargetMaxPrice("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h3 className="text-lg font-semibold text-gray-900">
        Add to Want List
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="wl-volume"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Comic Title
          </label>
          <input
            id="wl-volume"
            type="text"
            value={volumeName}
            onChange={(e) => setVolumeName(e.target.value)}
            placeholder="e.g., Amazing Spider-Man"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="wl-issue"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Issue #
          </label>
          <input
            id="wl-issue"
            type="text"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
            placeholder="e.g., 300"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="wl-price"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Target Max Price ($)
          </label>
          <input
            id="wl-price"
            type="number"
            value={targetMaxPrice}
            onChange={(e) => setTargetMaxPrice(e.target.value)}
            placeholder="e.g., 500"
            min="0"
            step="0.01"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="wl-notes"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="wl-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Looking for CGC 9.0+, prefer white pages"
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={
            submitting ||
            !volumeName.trim() ||
            !issueNumber.trim() ||
            !targetMaxPrice
          }
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {submitting ? "Adding..." : "Add to Want List"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
