import re
import os

with open("src/atlantis/AlbumEditor.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add document.fonts.ready to exportPDF
content = content.replace("const { default: jsPDF } = await import('jspdf');", "const { default: jsPDF } = await import('jspdf');\n      await document.fonts.ready;")

# 2. Replace state and spread logic
state_replacement = """  const [totalPages, setTotalPages] = useState(6); // Portada + 4 interiores + Contraportada
  const [currentLayoutId, setCurrentLayoutId] = useState<AlbumLayoutId>('layout-1');
  const [showLayouts, setShowLayouts] = useState(false);
  const [photos, setPhotos] = useState<AlbumPhoto[]>(() => generateAlbumSlotsForPages(0, 6, 'layout-1'));
  const [notes, setNotes] = useState<AlbumNote[]>([]);
  
  const [activePage, setActivePage] = useState(0);
  
  const [activeElement, setActiveElement] = useState<{ id: number, type: 'photo' | 'note' } | null>(null);
  const [dragging, setDragging] = useState<{ id: number, type: 'photo'|'note' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasPreviewRef = useRef<HTMLDivElement>(null);

  // URLs de fondo
"""

content = re.sub(
    r"const \[totalPages.*?// URLs de fondo",
    state_replacement,
    content,
    flags=re.DOTALL
)

# 3. Remove ResizeObserver and Spread logic
# We need to remove from `const SPREAD_RATIO` up to `// Resetear página activa al cambiar de spread:`
content = re.sub(r"  // ResizeObserver: calcula.*?setActivePageSide\('right'\);\n", "", content, flags=re.DOTALL)
content = re.sub(r"  const SPREAD_RATIO.*?\};\n    compute\(\);\n    const ro = new ResizeObserver\(compute\);\n    ro\.observe\(el\);\n    return \(\) => ro\.disconnect\(\);\n  \}, \[\]\);\n", "", content, flags=re.DOTALL)
content = re.sub(r"  const totalSpreads.*?\n\n", "\n", content, flags=re.DOTALL)
content = re.sub(r"  // Computed views for current spread.*?\}\, \[currentSpread\]\);\n", "", content, flags=re.DOTALL)
content = re.sub(r"  // Resetear página activa al cambiar de spread:.*?\n  \}, \[currentSpread\]\);\n", "", content, flags=re.DOTALL)

# 4. Update handlePointerMove
pointer_move_new = """  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !canvasPreviewRef.current) return;

    const rect = canvasPreviewRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (dragging.type === 'note') {
      setNotes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: Math.max(0.05, Math.min(0.95, x)), y: Math.max(0.05, Math.min(0.95, y)) } : n));
    }
  };"""

content = re.sub(
    r"  const handlePointerMove = \(e: React\.PointerEvent\) => \{.*?  \};\n",
    pointer_move_new + "\n",
    content,
    flags=re.DOTALL
)

# 5. Update addNote
add_note_new = """  const addNote = () => {
    const newId = Date.now();
    setNotes(prev => [...prev, {
      id: newId, pageIndex: activePage, text: 'Nota', color: '#FFF59D', x: 0.5, y: 0.5, scale: 1, rotation: 0, fontFamily: 'sans-serif', fontSizeScale: 1
    }]);
    setActiveElement({ id: newId, type: 'note' });
  };"""

content = re.sub(
    r"  const addNote = \(\) => \{.*?setActiveElement\(\{ id: newId, type: 'note' \}\);\n  \};",
    add_note_new,
    content,
    flags=re.DOTALL
)

# 6. Replace `renderPageUI` and the return statement up to FOOTER
main_ui_regex = r"  const renderPageUI = \(pageIndex: number \| null, isLeft: boolean\) => \{.*?\{/\* CONTROLES \*/\}"
main_ui_new = """  if (!experience) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col overflow-hidden select-none h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* HEADER */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-3 bg-black/90 shrink-0">
        <button onClick={onBack} className="py-1 px-2.5 bg-white/10 rounded-lg text-white flex gap-1 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14} /> VOLVER</button>
        <div className="flex flex-col items-center">
          <span className="font-black text-[10px] uppercase tracking-[0.2em]" style={{ color: pc }}>Mi Álbum</span>
        </div>
        <div className="text-[9px] font-black text-white/50 bg-white/10 px-2 py-1 rounded-md uppercase">
          {totalPages} Págs
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center p-1.5 min-h-0 bg-black">
        <div className="flex gap-1 w-full max-w-sm mb-1.5 overflow-x-auto hide-scrollbar shrink-0">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => { setActivePage(i); setActiveElement(null); }} className={`flex-1 min-w-[60px] py-1.5 px-2 rounded-md font-black text-[8px] uppercase tracking-wider ${activePage === i ? 'bg-yellow-500 text-slate-950' : 'bg-white/10 text-white/50'}`}>
              {getLabelForPage(i)}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full flex justify-center min-h-0" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
          <div ref={canvasPreviewRef} className="relative bg-white rounded-lg overflow-hidden border border-white/10 shadow-2xl" style={{ aspectRatio: ASPECT, maxHeight: '100%', touchAction: 'none' }} onPointerDown={() => { setActiveElement(null); }}>
            {getBackgroundForPage(activePage) && <img src={getBackgroundForPage(activePage)} className="absolute inset-0 w-full h-full object-fill z-10 pointer-events-none" alt="Fondo" />}
            
            {activePage === 0 && !getBackgroundForPage(activePage) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <h2 className="text-2xl font-black text-black/20 uppercase">Portada</h2>
              </div>
            )}

            <div className="absolute inset-0 z-20">
              {photos.filter(p => p.pageIndex === activePage).map(photo => {
                const isActive = activeElement?.type === 'photo' && activeElement.id === photo.id;
                return (
                  <div
                    key={photo.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveElement({ id: photo.id, type: 'photo' });
                      if (!photo.dataUrl) {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`absolute cursor-pointer ${isActive ? 'ring-2 z-50' : 'z-20'}`}
                    style={{
                      left: `${(photo.x - photo.widthPct/2)*100}%`,
                      top: `${(photo.y - photo.heightPct/2)*100}%`,
                      width: `${photo.widthPct*100}%`,
                      height: `${photo.heightPct*100}%`,
                      ringColor: isActive ? sc : 'transparent'
                    }}
                  >
                    {photo.dataUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="overflow-hidden" style={{
                          ...(photo.maskType === 'circle'
                            ? { width: '100%', aspectRatio: '1/1' }
                            : { width: '100%', height: '100%' }),
                          ...getMaskCSS(photo.maskType)
                        }}>
                          <img src={photo.dataUrl} className="w-full h-full object-cover" style={{ transform: `scale(${photo.scale}) rotate(${photo.rotation}deg)`, ...(photo.maskType === 'none' ? { border: '4px solid white', boxSizing: 'border-box' } : {}) }} alt="Slot" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full border border-dashed border-white/40 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"><Plus className="text-white/60" size={16} /></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-0 z-40 pointer-events-none">
              {notes.filter(n => n.pageIndex === activePage).map(note => {
                const isActive = activeElement?.type === 'note' && activeElement.id === note.id;
                return (
                  <div
                    key={note.id}
                    onPointerDown={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setActiveElement({ id: note.id, type: 'note' });
                      setDragging({ id: note.id, type: 'note' });
                    }}
                    className={`absolute flex items-center justify-center shadow-lg p-1 pointer-events-auto cursor-grab active:cursor-grabbing ${isActive ? 'ring-2 ring-white/80 z-50' : 'z-30'}`}
                    style={{
                      left: `${note.x*100}%`, top: `${note.y*100}%`, width: '25%', aspectRatio: '1/1',
                      transform: `translate(-50%, -50%) rotate(${note.rotation}deg) scale(${note.scale})`,
                      backgroundColor: note.color, color: note.color === '#000000' ? '#ffffff' : '#000000',
                      fontSize: `calc((3px + 1.2vw) * ${note.fontSizeScale})`, fontWeight: 'bold',
                      fontFamily: note.fontFamily === 'festive' ? '"Mountains of Christmas", cursive' : note.fontFamily === 'lobster' ? 'Lobster, cursive' : note.fontFamily === 'script' ? '"Pinyon Script", cursive' : 'Montserrat, sans-serif',
                      touchAction: 'none'
                    }}
                  >
                    {note.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES */}"""

content = re.sub(main_ui_regex, main_ui_new, content, flags=re.DOTALL)

with open("src/atlantis/AlbumEditor.tsx", "w", encoding="utf-8") as f:
    f.write(content)
