import sys

file_path = "C:/Users/windows8/.gemini/antigravity/scratch/mundial-quiniela/src/atlantis/PosterEditor.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "MessageSquare, Type } from 'lucide-react';",
    "MessageSquare, Type, LayoutTemplate } from 'lucide-react';"
)

# 2. Add type and generateSlots
old_generate = """const BORDER_PCT = 0.006; // ~0.6% of poster width as border gap (outline doesn't affect layout)

const generateDefaultSlots = (): PhotoSlot[] => {
  // Zona segura: 0-25% header, 25-93% contenido, 93-100% footnotes
  // Padding lateral: 2% a cada lado
  // 8 portrait 9:16 en 2 filas × 4 cols + 2 landscape en la base

  const PAD_X = 0.12;         // margen lateral (aumentado para reducir ancho/alto de cols)
  const PAD_Y_TOP = 0.30;     // empieza tras el header
  const GAP_X = 0.015;        // espacio entre columnas
  const GAP_Y = 0.02;         // espacio entre filas

  // Ancho disponible para las 4 columnas portrait
  const totalW = 1 - 2 * PAD_X;
  const colW = (totalW - 3 * GAP_X) / 4;  // width de cada slot portrait
  const colH = colW * (16 / 9) * (POSTER_W / POSTER_H); // altura 9:16 en coords relativas

  const xPositions = [0, 1, 2, 3].map(c => PAD_X + c * (colW + GAP_X) + colW / 2);
  const yRow1 = PAD_Y_TOP + colH / 2;
  const yRow2 = PAD_Y_TOP + colH + GAP_Y + colH / 2;

  const slots: PhotoSlot[] = [];
  let id = 0;

  // 8 portrait slots
  for (const y of [yRow1, yRow2]) {
    for (const x of xPositions) {
      slots.push({ id: id++, x, y, widthPct: colW, heightPct: colH, dataUrl: null, scale: 1, rotation: 0, maskType: 'none' });
    }
  }

  // 2 landscape slots at the bottom - centradas
  // Las hacemos apaisadas (por ejemplo 3:2 o 16:9 landscape)
  const lscapeW = colW * 2; // ancho de dos columnas aprox
  const lscapeH = lscapeW * (2 / 3) * (POSTER_W / POSTER_H);
  
  // Posición Y debajo de la fila 2
  const yRow2Bottom = yRow2 + colH / 2;
  const LSCAPE_Y = yRow2Bottom + GAP_Y + lscapeH / 2;
  
  // Centramos horizontalmente
  const centerX = 0.5;
  const lscapeX1 = centerX - GAP_X / 2 - lscapeW / 2;
  const lscapeX2 = centerX + GAP_X / 2 + lscapeW / 2;

  slots.push({ id: id++, x: lscapeX1, y: LSCAPE_Y, widthPct: lscapeW, heightPct: lscapeH, dataUrl: null, scale: 1, rotation: 0, maskType: 'none' });
  slots.push({ id: id++, x: lscapeX2, y: LSCAPE_Y, widthPct: lscapeW, heightPct: lscapeH, dataUrl: null, scale: 1, rotation: 0, maskType: 'none' });

  return slots;
};"""

new_generate = """const BORDER_PCT = 0.006; // ~0.6% of poster width as border gap (outline doesn't affect layout)

export type PosterLayoutId = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4';

export const generateSlots = (layoutId: PosterLayoutId, prevSlots: PhotoSlot[] = []): PhotoSlot[] => {
  const SAFE_Y_START = 0.28;
  const SAFE_Y_END = 0.92;
  const SAFE_H = SAFE_Y_END - SAFE_Y_START;
  const SAFE_W = 0.90;
  const START_X = 0.05;
  const GAP_X = 0.025;
  const GAP_Y = 0.025;

  const slots: PhotoSlot[] = [];
  let id = 0;

  const addSlot = (cx: number, cy: number, w: number, h: number) => {
    const prev = prevSlots[id];
    slots.push({
      id: id++,
      x: cx,
      y: cy,
      widthPct: w,
      heightPct: h,
      dataUrl: prev?.dataUrl || null,
      scale: prev?.scale || 1,
      rotation: prev?.rotation || 0,
      maskType: prev?.maskType || 'none',
    });
  };

  if (layoutId === 'layout-1') {
    // 4 portrait - 4 portrait - 2 landscape (10 slots)
    const cols = 4;
    const colW = (SAFE_W - (cols - 1) * GAP_X) / cols;
    const colH = colW * (16/9) * (POSTER_W / POSTER_H);
    
    const y1 = SAFE_Y_START + colH / 2;
    const y2 = y1 + colH + GAP_Y;
    
    for (const y of [y1, y2]) {
      for (let c = 0; c < cols; c++) {
        const x = START_X + c * (colW + GAP_X) + colW / 2;
        addSlot(x, y, colW, colH);
      }
    }
    
    const bottomH = SAFE_H - (2 * colH + 2 * GAP_Y);
    const lscapeH = Math.min(bottomH, colW * 2 * (9/16) * (POSTER_W / POSTER_H));
    const lscapeW = colW * 2 + GAP_X;
    const lscapeY = y2 + colH / 2 + GAP_Y + lscapeH / 2;
    
    const lx1 = 0.5 - GAP_X / 2 - lscapeW / 2;
    const lx2 = 0.5 + GAP_X / 2 + lscapeW / 2;
    
    addSlot(lx1, lscapeY, lscapeW, lscapeH);
    addSlot(lx2, lscapeY, lscapeW, lscapeH);

  } else if (layoutId === 'layout-2') {
    // 2 portrait grandes - abajo 2 landscapes pequeños (4 slots)
    const topAreaH = SAFE_H * 0.72;
    const bottomAreaH = SAFE_H * 0.28 - GAP_Y;
    
    const portW = (SAFE_W - GAP_X) / 2;
    const portH = topAreaH;
    const px1 = START_X + portW / 2;
    const px2 = START_X + portW + GAP_X + portW / 2;
    const py = SAFE_Y_START + portH / 2;
    
    addSlot(px1, py, portW, portH);
    addSlot(px2, py, portW, portH);
    
    const landW = (SAFE_W - GAP_X) / 2;
    const landH = bottomAreaH;
    const ly = SAFE_Y_START + topAreaH + GAP_Y + landH / 2;
    
    addSlot(px1, ly, landW, landH);
    addSlot(px2, ly, landW, landH);

  } else if (layoutId === 'layout-3') {
    // 1 portrait grande - 3 landscapes pequeños paralelos (4 slots)
    const leftW = SAFE_W * 0.58;
    const rightW = SAFE_W * 0.42 - GAP_X;
    
    const lx = START_X + leftW / 2;
    const ly = SAFE_Y_START + SAFE_H / 2;
    addSlot(lx, ly, leftW, SAFE_H);
    
    const rh = (SAFE_H - 2 * GAP_Y) / 3;
    const rx = START_X + leftW + GAP_X + rightW / 2;
    for (let i = 0; i < 3; i++) {
      const ry = SAFE_Y_START + i * (rh + GAP_Y) + rh / 2;
      addSlot(rx, ry, rightW, rh);
    }

  } else if (layoutId === 'layout-4') {
    // 1 landscape grande - abajo 3 landscape pequeños (4 slots)
    const topH = SAFE_H * 0.65;
    const bottomH = SAFE_H * 0.35 - GAP_Y;
    
    const tx = 0.5;
    const ty = SAFE_Y_START + topH / 2;
    addSlot(tx, ty, SAFE_W, topH);
    
    const bw = (SAFE_W - 2 * GAP_X) / 3;
    const by = SAFE_Y_START + topH + GAP_Y + bottomH / 2;
    
    for (let i = 0; i < 3; i++) {
      const bx = START_X + i * (bw + GAP_X) + bw / 2;
      addSlot(bx, by, bw, bottomH);
    }
  }

  return slots;
};"""

content = content.replace(old_generate, new_generate)

# 3. Component state
old_state = """  const [slots, setSlots] = useState<PhotoSlot[]>(generateDefaultSlots);
  const [notes, setNotes] = useState<StickyNote[]>([]);"""

new_state = """  const [currentLayoutId, setCurrentLayoutId] = useState<PosterLayoutId>('layout-1');
  const [slots, setSlots] = useState<PhotoSlot[]>(() => generateSlots('layout-1'));
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [showLayouts, setShowLayouts] = useState(false);"""

content = content.replace(old_state, new_state)

# 4. Change header slots text
content = content.replace("{filledCount}/{MAX_SLOTS}", "{filledCount}/{slots.length}")

# 5. resetAll function
content = content.replace("setSlots(generateDefaultSlots());", "setSlots(generateSlots(currentLayoutId));")

# 6. Add layout picker controls in footer
old_buttons = """        {/* Botones principales */}
        {activeSlot === null && activeNote === null && (
          <div className="flex items-center gap-2 w-full max-w-md animate-fade-in">
            <button
              onClick={resetAll}"""

new_buttons = """        {/* Botones principales */}
        {activeSlot === null && activeNote === null && !showLayouts && (
          <div className="flex items-center gap-2 w-full max-w-md animate-fade-in">
            <button
              onClick={resetAll}"""

content = content.replace(old_buttons, new_buttons)

old_export_btn = """            {isExporting ? (
              <><Loader2 className="animate-spin" size={16} /> Generando...</>
            ) : (
              <><Download size={16} /> Crear PDF para Imprimir</>
            )}
          </button>
          </div>
        )}"""

new_export_btn = """            {isExporting ? (
              <><Loader2 className="animate-spin" size={16} /> Generando...</>
            ) : (
              <><Download size={16} /> Crear PDF para Imprimir</>
            )}
          </button>
            <button
              onClick={() => setShowLayouts(true)}
              className="w-11 h-11 rounded-xl bg-gray-900 border border-white/10 text-white flex items-center justify-center active:bg-white active:text-black shrink-0"
            >
              <LayoutTemplate size={18} />
            </button>
          </div>
        )}

        {/* Layout Picker */}
        {showLayouts && (
          <div className="flex flex-col gap-2 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Elegir Plantilla</span>
              <button onClick={() => setShowLayouts(false)} className="text-white/50 active:scale-90"><ChevronLeft size={16}/></button>
            </div>
            <div className="flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar pb-2">
              {(['layout-1', 'layout-2', 'layout-3', 'layout-4'] as PosterLayoutId[]).map((lid, idx) => (
                <button
                  key={lid}
                  onClick={() => {
                    setCurrentLayoutId(lid);
                    setSlots(prev => generateSlots(lid, prev));
                    setShowLayouts(false);
                  }}
                  className={lex-shrink-0 w-16 h-20 rounded-lg border-2 flex items-center justify-center font-bold text-lg }
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}"""

content = content.replace(old_export_btn, new_export_btn)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
