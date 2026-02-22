"use client";

import { useState } from "react";

interface AddToCollectionModalProps {
  issue: {
    comicVineIssueId: number;
    comicVineVolumeId: number;
    volumeName: string;
    issueNumber: string;
    name?: string | null;
    imageUrl?: string | null;
    coverDate?: string | null;
  };
  onAdd: (issue: AddToCollectionModalProps["issue"] & { condition?: string; pricePaid?: number; notes?: string }) => Promise<boolean>;
  onClose: () => void;
}

const GRADES = [
  { value: "10.0", label: "GM 10.0 — Gem Mint" },
  { value: "9.8", label: "NM/M 9.8 — Near Mint/Mint" },
  { value: "9.6", label: "NM+ 9.6" },
  { value: "9.4", label: "NM 9.4 — Near Mint" },
  { value: "9.2", label: "NM- 9.2" },
  { value: "9.0", label: "VF/NM 9.0" },
  { value: "8.0", label: "VF 8.0 — Very Fine" },
  { value: "7.0", label: "FN/VF 7.0" },
  { value: "6.0", label: "FN 6.0 — Fine" },
  { value: "5.0", label: "VG/FN 5.0" },
  { value: "4.0", label: "VG 4.0 — Very Good" },
  { value: "3.0", label: "GD/VG 3.0" },
  { value: "2.0", label: "GD 2.0 — Good" },
  { value: "1.0", label: "FR 1.0 — Fair" },
  { value: "0.5", label: "PR 0.5 — Poor" },
  { value: "raw", label: "Raw / Ungraded" },
];

export function AddToCollectionModal({ issue, onAdd, onClose }: AddToCollectionModalProps) {
  const [grade, setGrade] = useState("raw");
  const [pricePaid, setPricePaid] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const notesArr: string[] = [];
    if (notes) notesArr.push(notes);
    if (askingPrice) notesArr.push(`Asking: $${askingPrice}`);
    
    const ok = await onAdd({
      ...issue,
      condition: grade === "raw" ? "Raw" : grade,
      pricePaid: pricePaid ? parseFloat(pricePaid) : undefined,
      notes: notesArr.length > 0 ? notesArr.join(" | ") : undefined,
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          {issue.imageUrl && (
            <img src={issue.imageUrl} alt="" className="h-16 w-11 rounded object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{issue.volumeName}</h3>
            <p className="text-sm text-gray-500">Issue #{issue.issueNumber}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Grade / Condition</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price Paid ($)</label>
              <input
                type="number"
                value={pricePaid}
                onChange={(e) => setPricePaid(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Asking Price ($)</label>
              <input
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="Sell for..."
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
            >
              {busy ? "Adding..." : "Add to Collection"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
