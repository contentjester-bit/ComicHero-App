"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/hooks/use-collection";

interface ConditionGrade {
  grade: string;
  numericGrade: number;
  confidence: number;
  issues: string[];
  positives: string[];
  gradingNotes: string;
  cgcEquivalent: string;
}

interface PriceData {
  averagePrice: number;
  medianPrice: number;
  lowestPrice: number;
  highestPrice: number;
  suggestedPrice: number;
  marketVelocity: string;
  totalSales: number;
  priceRange: string;
  recentSales: Array<{
    title: string;
    price: number;
    condition: string;
    soldDate: string;
  }>;
}

interface GeneratedListing {
  title: string;
  description: string;
  keywords: string[];
  bestTimeToList: string;
}

interface CollectionComic {
  comicVineIssueId: number;
  volumeName: string;
  issueNumber: string;
  name: string | null;
  imageUrl: string | null;
  coverDate: string | null;
  condition: string | null;
}

function SellerToolsContent() {
  const searchParams = useSearchParams();

  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedComic, setSelectedComic] = useState<CollectionComic | null>(null);
  const [quickSellLoading, setQuickSellLoading] = useState(false);
  const [quickSellCondition, setQuickSellCondition] = useState("VF");
  const [quickSellResults, setQuickSellResults] = useState<{ price?: PriceData; listing?: GeneratedListing } | null>(null);

  const [gradingImage, setGradingImage] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<ConditionGrade | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);

  const [priceCheckVolume, setPriceCheckVolume] = useState("");
  const [priceCheckIssue, setPriceCheckIssue] = useState("");
  const [priceCheckCondition, setPriceCheckCondition] = useState("");
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [listingVolume, setListingVolume] = useState("");
  const [listingIssue, setListingIssue] = useState("");
  const [listingCondition, setListingCondition] = useState("");
  const [generatedListing, setGeneratedListing] = useState<GeneratedListing | null>(null);
  const [listingLoading, setListingLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { items: collection, loading: collectionLoading } = useCollection();

  useEffect(() => {
    const volume = searchParams.get("volume");
    const issue = searchParams.get("issue");
    if (volume) { setPriceCheckVolume(volume); setListingVolume(volume); }
    if (issue) { setPriceCheckIssue(issue); setListingIssue(issue); }
  }, [searchParams]);

  const copyText = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectFromCollection = (item: CollectionComic) => {
    setSelectedComic(item);
    setPriceCheckVolume(item.volumeName);
    setPriceCheckIssue(item.issueNumber);
    setPriceCheckCondition(item.condition || "VF");
    setListingVolume(item.volumeName);
    setListingIssue(item.issueNumber);
    setListingCondition(item.condition || "VF");
    setQuickSellCondition(item.condition || "VF");
    setShowCollectionModal(false);
  };

  const handleQuickSell = async (comic: CollectionComic) => {
    setSelectedComic(comic);
    setQuickSellLoading(true);
    setError(null);
    setQuickSellResults(null);
    const condition = comic.condition || quickSellCondition;
    const results: { price?: PriceData; listing?: GeneratedListing } = {};
    try {
      const [priceRes, listingRes] = await Promise.allSettled([
        fetch("/api/ai/price-check", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ volumeName: comic.volumeName, issueNumber: comic.issueNumber, condition }),
        }).then(r => r.json()),
        fetch("/api/ai/generate-listing", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ volumeName: comic.volumeName, issueNumber: comic.issueNumber, condition, coverDate: comic.coverDate }),
        }).then(r => r.json()),
      ]);
      if (priceRes.status === "fulfilled" && priceRes.value.success) { results.price = priceRes.value.data; setPriceData(priceRes.value.data); }
      if (listingRes.status === "fulfilled" && listingRes.value.success) { results.listing = listingRes.value.data; setGeneratedListing(listingRes.value.data); }
      if (!results.price && !results.listing) setError("Both price check and listing generation failed. Check your API keys in Vercel.");
      setQuickSellResults(results);
      setPriceCheckVolume(comic.volumeName); setPriceCheckIssue(comic.issueNumber); setPriceCheckCondition(condition);
      setListingVolume(comic.volumeName); setListingIssue(comic.issueNumber); setListingCondition(condition);
      setShowCollectionModal(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Quick sell failed"); }
    finally { setQuickSellLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGradingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGradeCondition = async () => {
    if (!gradingImage) return;
    setGradingLoading(true); setError(null);
    try {
      const res = await fetch("/api/ai/grade-condition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: gradingImage }) });
      const data = await res.json();
      if (data.success) setGradeResult(data.data); else setError(data.error || "Failed to grade");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to grade"); }
    finally { setGradingLoading(false); }
  };

  const handlePriceCheck = async () => {
    if (!priceCheckVolume || !priceCheckIssue) return;
    setPriceLoading(true); setError(null);
    try {
      const res = await fetch("/api/ai/price-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ volumeName: priceCheckVolume, issueNumber: priceCheckIssue, condition: priceCheckCondition }) });
      const data = await res.json();
      if (data.success) setPriceData(data.data); else setError(data.error || "Failed to check prices");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to check prices"); }
    finally { setPriceLoading(false); }
  };

  const handleGenerateListing = async () => {
    if (!listingVolume || !listingIssue) return;
    setListingLoading(true); setError(null);
    try {
      const res = await fetch("/api/ai/generate-listing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ volumeName: listingVolume, issueNumber: listingIssue, condition: listingCondition }) });
      const data = await res.json();
      if (data.success) setGeneratedListing(data.data); else setError(data.error || "Failed to generate listing");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to generate"); }
    finally { setListingLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">🤖 AI Seller Tools</h1>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">BETA</span>
        </div>
        <p className="mt-2 text-lg text-purple-100">AI-powered tools to price, grade, and list your comics faster</p>
      </div>

      {/* Quick Sell */}
      <div className="rounded-lg border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
        <h2 className="text-xl font-bold text-gray-900">⚡ Quick Sell from Collection</h2>
        <p className="mt-1 text-sm text-gray-600">Pick a comic — auto-fill forms or get instant pricing + listing</p>
        <button onClick={() => setShowCollectionModal(true)} className="mt-4 rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700">📚 Select from My Collection</button>

        {selectedComic && (
          <div className="mt-4 rounded-lg border border-green-200 bg-white p-4">
            <div className="flex items-center gap-4">
              {selectedComic.imageUrl && <img src={selectedComic.imageUrl} alt="" className="h-24 w-16 rounded object-contain" />}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{selectedComic.volumeName} #{selectedComic.issueNumber}</h3>
                {selectedComic.name && <p className="text-sm text-gray-600">{selectedComic.name}</p>}
                {selectedComic.condition && <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Condition: {selectedComic.condition}</span>}
                <p className="mt-1 text-xs text-green-600">✓ Forms below auto-filled</p>
              </div>
            </div>
          </div>
        )}

        {quickSellResults && (
          <div className="mt-4 space-y-3">
            {quickSellResults.price && (
              <div className="rounded-lg border border-green-200 bg-white p-4">
                <h3 className="mb-2 font-semibold text-gray-900">💰 Pricing Results</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-green-50 p-3 text-center"><p className="text-xs text-green-700">Suggested</p><p className="text-xl font-bold text-green-900">${quickSellResults.price.suggestedPrice}</p></div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-xs text-blue-700">Median</p><p className="text-xl font-bold text-blue-900">${quickSellResults.price.medianPrice}</p></div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center"><p className="text-xs text-purple-700">Range</p><p className="text-sm font-bold text-purple-900">{quickSellResults.price.priceRange}</p></div>
                </div>
              </div>
            )}
            {quickSellResults.listing && (
              <div className="rounded-lg border border-indigo-200 bg-white p-4">
                <h3 className="mb-2 font-semibold text-gray-900">✍️ Generated Listing</h3>
                <div className="rounded bg-gray-50 p-3"><p className="text-sm font-medium text-gray-900">{quickSellResults.listing.title}</p></div>
                <button onClick={() => copyText(quickSellResults.listing!.title, "qs-title")} className="mt-1 text-xs text-indigo-600 hover:text-indigo-700">{copiedField === "qs-title" ? "✅ Copied!" : "📋 Copy Title"}</button>
                <div className="mt-2 max-h-32 overflow-y-auto rounded bg-gray-50 p-3"><p className="whitespace-pre-wrap text-xs text-gray-700">{quickSellResults.listing.description}</p></div>
                <button onClick={() => copyText(quickSellResults.listing!.description, "qs-desc")} className="mt-1 text-xs text-indigo-600 hover:text-indigo-700">{copiedField === "qs-desc" ? "✅ Copied!" : "📋 Copy Description"}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Select Comic</h3>
              <button onClick={() => setShowCollectionModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="mb-4 text-sm text-gray-500">Click <strong>Fill Forms</strong> to auto-fill below, or <strong>⚡ Sell</strong> for instant pricing + listing.</p>
            {collectionLoading ? <p className="text-center text-gray-500">Loading...</p> : collection.length === 0 ? <p className="text-center text-gray-500">No comics in collection yet.</p> : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Condition (for Quick Sell)</label>
                  <select value={quickSellCondition} onChange={(e) => setQuickSellCondition(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    <option value="NM">Near Mint</option><option value="VF/NM">VF/NM</option><option value="VF">Very Fine</option><option value="FN">Fine</option><option value="VG">Very Good</option><option value="G">Good</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {collection.map((item) => (
                    <div key={item.comicVineIssueId} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md">
                      {item.imageUrl && <div className="relative aspect-[3/4] bg-gray-100"><img src={item.imageUrl} alt="" className="h-full w-full object-contain" /></div>}
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.volumeName}</p>
                        <p className="text-xs text-gray-600">#{item.issueNumber}</p>
                        {item.condition && <span className="inline-block rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-700">{item.condition}</span>}
                        <div className="flex gap-1 pt-1">
                          <button onClick={() => handleSelectFromCollection(item)} className="flex-1 rounded bg-indigo-100 px-1 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-200">Fill Forms</button>
                          <button onClick={() => handleQuickSell(item)} disabled={quickSellLoading} className="flex-1 rounded bg-green-100 px-1 py-1 text-[10px] font-medium text-green-700 hover:bg-green-200 disabled:opacity-50">⚡ Sell</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {quickSellLoading && <div className="mt-4 rounded-lg bg-blue-50 p-4 text-center text-blue-600">⚡ Running AI analysis... 10-20 seconds</div>}
          </div>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700"><strong>Error:</strong> {error}</div>}

      {/* Condition Grading */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">📸 AI Condition Grading</h2>
        <p className="mt-1 text-sm text-gray-600">Upload a photo of your comic cover for a CGC-style grade</p>
        <div className="mt-4 space-y-4">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
          {gradingImage && <img src={gradingImage} alt="" className="h-64 w-auto rounded-lg border object-contain" />}
          <button onClick={handleGradeCondition} disabled={!gradingImage || gradingLoading} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400">{gradingLoading ? "Grading..." : "Grade Comic"}</button>
          {gradeResult && (
            <div className="rounded-lg bg-purple-50 p-4">
              <h3 className="text-lg font-bold text-purple-900">{gradeResult.grade}</h3>
              <p className="text-sm text-purple-700">Numeric: {gradeResult.numericGrade} | Confidence: {gradeResult.confidence}% | {gradeResult.cgcEquivalent}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><p className="text-sm font-semibold text-purple-900">Issues:</p><ul className="list-disc pl-5 text-sm text-purple-700">{gradeResult.issues.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                <div><p className="text-sm font-semibold text-purple-900">Positives:</p><ul className="list-disc pl-5 text-sm text-purple-700">{gradeResult.positives.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              </div>
              <p className="mt-2 text-sm text-purple-700">{gradeResult.gradingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Checker */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">💰 eBay Price Checker</h2>
        <p className="mt-1 text-sm text-gray-600">Recent sold prices and AI-recommended pricing</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="block text-sm font-medium text-gray-700">Series Name</label><input type="text" value={priceCheckVolume} onChange={(e) => setPriceCheckVolume(e.target.value)} placeholder="Amazing Spider-Man" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Issue #</label><input type="text" value={priceCheckIssue} onChange={(e) => setPriceCheckIssue(e.target.value)} placeholder="129" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Condition</label><select value={priceCheckCondition} onChange={(e) => setPriceCheckCondition(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"><option value="">Any</option><option value="NM">Near Mint</option><option value="VF">Very Fine</option><option value="FN">Fine</option><option value="VG">Very Good</option><option value="G">Good</option></select></div>
        </div>
        <button onClick={handlePriceCheck} disabled={!priceCheckVolume || !priceCheckIssue || priceLoading} className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400">{priceLoading ? "Checking..." : "Check eBay Prices"}</button>
        {priceData && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-4"><p className="text-xs text-green-700">Suggested</p><p className="text-2xl font-bold text-green-900">${priceData.suggestedPrice}</p></div>
              <div className="rounded-lg bg-blue-50 p-4"><p className="text-xs text-blue-700">Median</p><p className="text-2xl font-bold text-blue-900">${priceData.medianPrice}</p></div>
              <div className="rounded-lg bg-purple-50 p-4"><p className="text-xs text-purple-700">Range</p><p className="text-lg font-bold text-purple-900">{priceData.priceRange}</p></div>
              <div className="rounded-lg bg-amber-50 p-4"><p className="text-xs text-amber-700">Market</p><p className="text-2xl font-bold text-amber-900">{priceData.marketVelocity}</p></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Sales ({priceData.totalSales})</h3>
              <div className="mt-2 space-y-2">{priceData.recentSales.slice(0, 5).map((sale, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div><p className="font-medium text-gray-900">{sale.title}</p><p className="text-xs text-gray-500">{sale.condition} • {new Date(sale.soldDate).toLocaleDateString()}</p></div>
                  <p className="font-bold text-green-600">${sale.price}</p>
                </div>
              ))}</div>
            </div>
          </div>
        )}
      </div>

      {/* Listing Generator */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">✍️ AI Listing Generator</h2>
        <p className="mt-1 text-sm text-gray-600">Professional eBay listings with SEO-optimized titles</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="block text-sm font-medium text-gray-700">Series Name</label><input type="text" value={listingVolume} onChange={(e) => setListingVolume(e.target.value)} placeholder="Amazing Spider-Man" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Issue #</label><input type="text" value={listingIssue} onChange={(e) => setListingIssue(e.target.value)} placeholder="129" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Condition</label><select value={listingCondition} onChange={(e) => setListingCondition(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"><option value="">Select</option><option value="NM">Near Mint</option><option value="VF/NM">VF/NM</option><option value="VF">Very Fine</option><option value="FN">Fine</option><option value="VG">Very Good</option><option value="G">Good</option></select></div>
        </div>
        <button onClick={handleGenerateListing} disabled={!listingVolume || !listingIssue || !listingCondition || listingLoading} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400">{listingLoading ? "Generating..." : "Generate Listing"}</button>
        {generatedListing && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900">Title</label>
              <div className="mt-1 rounded-lg bg-gray-50 p-3"><p className="font-medium text-gray-900">{generatedListing.title}</p></div>
              <button onClick={() => copyText(generatedListing.title, "title")} className="mt-2 text-xs text-indigo-600">{copiedField === "title" ? "✅ Copied!" : "📋 Copy Title"}</button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Description</label>
              <div className="mt-1 max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-3"><p className="whitespace-pre-wrap text-sm text-gray-700">{generatedListing.description}</p></div>
              <button onClick={() => copyText(generatedListing.description, "desc")} className="mt-2 text-xs text-indigo-600">{copiedField === "desc" ? "✅ Copied!" : "📋 Copy Description"}</button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900">Keywords</label>
              <div className="mt-1 flex flex-wrap gap-2">{generatedListing.keywords.map((kw, i) => <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{kw}</span>)}</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-900">💡 Best Time to List</p>
              <p className="text-sm text-amber-700">{generatedListing.bestTimeToList}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerToolsPage() {
  return <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}><SellerToolsContent /></Suspense>;
}
