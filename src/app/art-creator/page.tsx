"use client";

import { useState, useRef, useEffect } from "react";

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
  bold: boolean;
  italic: boolean;
  stroke: boolean;
  strokeColor: string;
}

interface CanvasState {
  width: number;
  height: number;
  background: string;
  backgroundImage: string | null;
  overlayColor: string;
  overlayOpacity: number;
  texts: TextElement[];
  borderWidth: number;
  borderColor: string;
}

const TEMPLATES = [
  { name: "Classic Cover", bg: "#1a1a2e", overlay: "#000000", opacity: 0.3, border: 4, borderColor: "#ffd700", texts: [
    { text: "AMAZING", x: 50, y: 15, fontSize: 48, fontFamily: "Impact", color: "#ff0000", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#ffff00" },
    { text: "COMICS", x: 50, y: 28, fontSize: 36, fontFamily: "Impact", color: "#ffff00", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#000000" },
    { text: "#1", x: 85, y: 10, fontSize: 28, fontFamily: "Impact", color: "#ffffff", rotation: -15, bold: true, italic: false, stroke: true, strokeColor: "#000000" },
  ]},
  { name: "Modern Variant", bg: "#0f0f0f", overlay: "#6366f1", opacity: 0.15, border: 0, borderColor: "#000", texts: [
    { text: "TITLE", x: 10, y: 85, fontSize: 54, fontFamily: "Helvetica", color: "#ffffff", rotation: 0, bold: true, italic: false, stroke: false, strokeColor: "#000" },
    { text: "ISSUE ONE", x: 10, y: 93, fontSize: 18, fontFamily: "Helvetica", color: "#a5b4fc", rotation: 0, bold: false, italic: false, stroke: false, strokeColor: "#000" },
  ]},
  { name: "Retro Pop", bg: "#ffe135", overlay: "#ff6b35", opacity: 0.1, border: 6, borderColor: "#ff0000", texts: [
    { text: "POW!", x: 50, y: 40, fontSize: 72, fontFamily: "Impact", color: "#ff0000", rotation: -5, bold: true, italic: false, stroke: true, strokeColor: "#000000" },
    { text: "COMIC TITLE", x: 50, y: 60, fontSize: 28, fontFamily: "Arial", color: "#000000", rotation: 0, bold: true, italic: false, stroke: false, strokeColor: "#000" },
  ]},
  { name: "Dark Knight", bg: "#0a0a0a", overlay: "#1e3a5f", opacity: 0.2, border: 2, borderColor: "#333333", texts: [
    { text: "THE DARK", x: 50, y: 20, fontSize: 44, fontFamily: "Georgia", color: "#c0c0c0", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#000000" },
    { text: "ISSUE", x: 50, y: 80, fontSize: 18, fontFamily: "Georgia", color: "#666666", rotation: 0, bold: false, italic: true, stroke: false, strokeColor: "#000" },
  ]},
  { name: "Blank Canvas", bg: "#ffffff", overlay: "#000000", opacity: 0, border: 0, borderColor: "#000", texts: [] },
];

const FONTS = ["Impact", "Arial", "Helvetica", "Georgia", "Courier New", "Times New Roman", "Comic Sans MS", "Verdana"];
const COLORS = ["#ff0000", "#ff6600", "#ffff00", "#00ff00", "#0066ff", "#6600ff", "#ff00ff", "#ffffff", "#000000", "#c0c0c0", "#ffd700", "#ff1493"];

export default function ArtCreatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<CanvasState>({
    width: 600, height: 900, background: "#1a1a2e", backgroundImage: null,
    overlayColor: "#000000", overlayOpacity: 0.3, texts: [], borderWidth: 4, borderColor: "#ffd700",
  });
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // ── Render canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = state.width;
    canvas.height = state.height;

    // Background
    ctx.fillStyle = state.background;
    ctx.fillRect(0, 0, state.width, state.height);

    // Background image
    if (state.backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, state.width, state.height);
        // Overlay
        ctx.fillStyle = state.overlayColor;
        ctx.globalAlpha = state.overlayOpacity;
        ctx.fillRect(0, 0, state.width, state.height);
        ctx.globalAlpha = 1;
        drawTextsAndBorder(ctx);
      };
      img.src = state.backgroundImage;
    } else {
      // Overlay on solid bg
      ctx.fillStyle = state.overlayColor;
      ctx.globalAlpha = state.overlayOpacity;
      ctx.fillRect(0, 0, state.width, state.height);
      ctx.globalAlpha = 1;
      drawTextsAndBorder(ctx);
    }

    function drawTextsAndBorder(ctx: CanvasRenderingContext2D) {
      // Text elements
      for (const t of state.texts) {
        ctx.save();
        const px = (t.x / 100) * state.width;
        const py = (t.y / 100) * state.height;
        ctx.translate(px, py);
        ctx.rotate((t.rotation * Math.PI) / 180);

        const fontStyle = `${t.italic ? "italic " : ""}${t.bold ? "bold " : ""}${t.fontSize}px ${t.fontFamily}`;
        ctx.font = fontStyle;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (t.stroke) {
          ctx.strokeStyle = t.strokeColor;
          ctx.lineWidth = Math.max(2, t.fontSize / 10);
          ctx.strokeText(t.text, 0, 0);
        }
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);

        // Selection highlight
        if (selectedText === t.id) {
          const metrics = ctx.measureText(t.text);
          ctx.strokeStyle = "#00aaff";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(-metrics.width / 2 - 4, -t.fontSize / 2 - 4, metrics.width + 8, t.fontSize + 8);
          ctx.setLineDash([]);
        }

        ctx.restore();
      }

      // Border
      if (state.borderWidth > 0) {
        ctx.strokeStyle = state.borderColor;
        ctx.lineWidth = state.borderWidth;
        ctx.strokeRect(state.borderWidth / 2, state.borderWidth / 2, state.width - state.borderWidth, state.height - state.borderWidth);
      }
    }
  }, [state, selectedText]);

  const addText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`, text: "NEW TEXT", x: 50, y: 50, fontSize: 36,
      fontFamily: "Impact", color: "#ffffff", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#000000",
    };
    setState(prev => ({ ...prev, texts: [...prev.texts, newText] }));
    setSelectedText(newText.id);
  };

  const updateText = (id: string, updates: Partial<TextElement>) => {
    setState(prev => ({ ...prev, texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteText = (id: string) => {
    setState(prev => ({ ...prev, texts: prev.texts.filter(t => t.id !== id) }));
    if (selectedText === id) setSelectedText(null);
  };

  const applyTemplate = (idx: number) => {
    const t = TEMPLATES[idx];
    setState(prev => ({
      ...prev, background: t.bg, overlayColor: t.overlay, overlayOpacity: t.opacity,
      borderWidth: t.border, borderColor: t.borderColor,
      texts: t.texts.map((txt, i) => ({ ...txt, id: `tmpl-${Date.now()}-${i}` })),
    }));
    setSelectedText(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = state.width / rect.width;
    const scaleY = state.height / rect.height;
    const clickX = ((e.clientX - rect.left) * scaleX / state.width) * 100;
    const clickY = ((e.clientY - rect.top) * scaleY / state.height) * 100;

    // Find clicked text
    let found: string | null = null;
    for (const t of [...state.texts].reverse()) {
      const dx = Math.abs(t.x - clickX);
      const dy = Math.abs(t.y - clickY);
      if (dx < 15 && dy < 8) { found = t.id; break; }
    }
    setSelectedText(found);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleCanvasClick(e);
    if (selectedText) setDragging(selectedText);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateText(dragging, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleCanvasMouseUp = () => setDragging(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setState(prev => ({ ...prev, backgroundImage: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `comichero-cover-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeName: aiPrompt, issueNumber: "Cover", condition: "NM", mode: "art-description" }),
      });
      const data = await res.json();
      if (data.success && data.data?.title) {
        // Apply AI suggestion as text
        const words = data.data.title.split(" ");
        const newTexts: TextElement[] = [];
        if (words.length >= 2) {
          newTexts.push({ id: `ai-${Date.now()}-1`, text: words.slice(0, Math.ceil(words.length/2)).join(" ").toUpperCase(), x: 50, y: 25, fontSize: 48, fontFamily: "Impact", color: "#ffffff", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#000000" });
          newTexts.push({ id: `ai-${Date.now()}-2`, text: words.slice(Math.ceil(words.length/2)).join(" ").toUpperCase(), x: 50, y: 40, fontSize: 36, fontFamily: "Impact", color: "#ffd700", rotation: 0, bold: true, italic: false, stroke: true, strokeColor: "#000000" });
        }
        setState(prev => ({ ...prev, texts: [...prev.texts, ...newTexts] }));
      }
    } catch { /* */ }
    finally { setGenerating(false); }
  };

  const selected = state.texts.find(t => t.id === selectedText);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
        <h1 className="text-3xl font-bold">🎨 Cover Art Creator</h1>
        <p className="mt-1 text-pink-100">Design custom comic cover art for comicscoverart.com</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-900">
            <canvas ref={canvasRef} className="w-full cursor-crosshair"
              style={{ aspectRatio: `${state.width}/${state.height}` }}
              onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={handleExport} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">💾 Export PNG</button>
            <button onClick={addText} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Add Text</button>
            <button onClick={() => fileInputRef.current?.click()} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">🖼️ Upload Background</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Templates */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Templates</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(i)} className="rounded-md border border-gray-200 p-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300">
                  <div className="mb-1 h-3 w-full rounded" style={{ background: t.bg }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Assist */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">🤖 AI Assist</h3>
            <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your cover concept..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button onClick={handleAiGenerate} disabled={generating} className="mt-2 w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400">
              {generating ? "Generating..." : "Generate Text"}
            </button>
          </div>

          {/* Canvas Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Canvas</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1"><span className="text-xs text-gray-500">Background</span><input type="color" value={state.background} onChange={(e) => setState(prev => ({ ...prev, background: e.target.value }))} className="mt-1 block h-8 w-full cursor-pointer" /></label>
                <label className="flex-1"><span className="text-xs text-gray-500">Border</span><input type="color" value={state.borderColor} onChange={(e) => setState(prev => ({ ...prev, borderColor: e.target.value }))} className="mt-1 block h-8 w-full cursor-pointer" /></label>
              </div>
              <label><span className="text-xs text-gray-500">Border Width: {state.borderWidth}px</span><input type="range" min="0" max="20" value={state.borderWidth} onChange={(e) => setState(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))} className="w-full" /></label>
              <label><span className="text-xs text-gray-500">Overlay Opacity: {Math.round(state.overlayOpacity * 100)}%</span><input type="range" min="0" max="100" value={state.overlayOpacity * 100} onChange={(e) => setState(prev => ({ ...prev, overlayOpacity: parseInt(e.target.value) / 100 }))} className="w-full" /></label>
              {state.backgroundImage && <button onClick={() => setState(prev => ({ ...prev, backgroundImage: null }))} className="text-xs text-red-600 hover:text-red-700">Remove background image</button>}
            </div>
          </div>

          {/* Selected Text Editor */}
          {selected && (
            <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Edit Text</h3>
                <button onClick={() => deleteText(selected.id)} className="text-xs text-red-600 hover:text-red-700">🗑️ Delete</button>
              </div>
              <div className="space-y-2">
                <input type="text" value={selected.text} onChange={(e) => updateText(selected.id, { text: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-bold" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={selected.fontFamily} onChange={(e) => updateText(selected.id, { fontFamily: e.target.value })} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input type="number" value={selected.fontSize} onChange={(e) => updateText(selected.id, { fontSize: parseInt(e.target.value) || 24 })} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {COLORS.map(c => <button key={c} onClick={() => updateText(selected.id, { color: c })} className={`h-6 w-6 rounded-full border-2 ${selected.color === c ? "border-indigo-500 scale-110" : "border-gray-200"}`} style={{ background: c }} />)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateText(selected.id, { bold: !selected.bold })} className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${selected.bold ? "border-indigo-500 bg-indigo-100" : "border-gray-200"}`}>B</button>
                  <button onClick={() => updateText(selected.id, { italic: !selected.italic })} className={`flex-1 rounded-md border px-2 py-1 text-xs italic ${selected.italic ? "border-indigo-500 bg-indigo-100" : "border-gray-200"}`}>I</button>
                  <button onClick={() => updateText(selected.id, { stroke: !selected.stroke })} className={`flex-1 rounded-md border px-2 py-1 text-xs ${selected.stroke ? "border-indigo-500 bg-indigo-100" : "border-gray-200"}`}>Outline</button>
                </div>
                {selected.stroke && (
                  <div className="flex gap-1">
                    <span className="text-xs text-gray-500">Stroke:</span>
                    {COLORS.slice(0, 6).map(c => <button key={c} onClick={() => updateText(selected.id, { strokeColor: c })} className={`h-5 w-5 rounded-full border ${selected.strokeColor === c ? "border-indigo-500" : "border-gray-200"}`} style={{ background: c }} />)}
                  </div>
                )}
                <label><span className="text-xs text-gray-500">Rotation: {selected.rotation}°</span><input type="range" min="-45" max="45" value={selected.rotation} onChange={(e) => updateText(selected.id, { rotation: parseInt(e.target.value) })} className="w-full" /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label><span className="text-xs text-gray-500">X: {selected.x.toFixed(0)}%</span><input type="range" min="0" max="100" value={selected.x} onChange={(e) => updateText(selected.id, { x: parseInt(e.target.value) })} className="w-full" /></label>
                  <label><span className="text-xs text-gray-500">Y: {selected.y.toFixed(0)}%</span><input type="range" min="0" max="100" value={selected.y} onChange={(e) => updateText(selected.id, { y: parseInt(e.target.value) })} className="w-full" /></label>
                </div>
              </div>
            </div>
          )}

          {/* Text Layers */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Text Layers ({state.texts.length})</h3>
            {state.texts.length === 0 ? (
              <p className="text-xs text-gray-500">Click &quot;+ Add Text&quot; to start</p>
            ) : (
              <div className="space-y-1">
                {state.texts.map((t) => (
                  <button key={t.id} onClick={() => setSelectedText(t.id)}
                    className={`w-full rounded-md border px-3 py-1.5 text-left text-xs ${selectedText === t.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <span className="font-medium">{t.text}</span>
                    <span className="ml-2 text-gray-400">{t.fontSize}px {t.fontFamily}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* comicscoverart.com note */}
      <div className="rounded-lg border border-pink-200 bg-pink-50 p-4 text-center">
        <p className="text-sm text-gray-700">Designs created here will be available on <a href="https://comicscoverart.com" target="_blank" rel="noopener noreferrer" className="font-bold text-pink-600 hover:text-pink-700">comicscoverart.com</a></p>
      </div>
    </div>
  );
}
