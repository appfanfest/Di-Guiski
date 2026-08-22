export type MaskType = 'none' | 'circle' | 'heart' | 'star' | 'diamond' | 'flower' | 'splash';

export const getMaskCSS = (maskType: MaskType): React.CSSProperties => {
  switch (maskType) {
    case 'circle':
      return { clipPath: 'circle(50% at 50% 50%)' };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'star':
      return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
    case 'heart':
      const heartPath = 'M50,80 C10,50 5,15 25,10 C40,5 50,25 50,25 C50,25 60,5 75,10 C95,15 90,50 50,80 Z';
      return { 
        WebkitMaskImage: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${heartPath}" fill="black"/></svg>')`,
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
      };
    case 'flower':
    case 'splash':
      // Usaremos clip-path path también para que funcione directamente (asumiendo 100x100 coord space)
      // Pero CSS clip-path path() no hace auto-scale al contenedor fácilmente sin SVG integrado.
      // Usar máscaras inline para esto es más seguro.
      const splashPath = 'M75.1,-90.6C90.2,-74.6,90.2,-43.3,91.8,-12.3C93.4,18.7,96.6,49.5,84.1,72.4C71.6,95.3,43.4,110.3,13.6,111.4C-16.2,112.5,-47.5,99.8,-68.8,77.5C-90.1,55.2,-101.4,23.3,-101.5,-8.3C-101.6,-39.9,-90.5,-71.2,-69.1,-87.6C-47.7,-104,-16,-105.5,12.7,-100.9C41.4,-96.3,60,-84.6,75.1,-90.6Z';
      const flowerPath = 'M50,10 C60,-10 80,10 60,30 C80,20 100,40 80,60 C100,80 70,90 60,70 C60,100 40,100 40,70 C30,90 0,80 20,60 C0,40 20,20 40,30 C20,10 40,-10 50,10 Z';
      
      const pathStr = maskType === 'splash' ? splashPath : flowerPath;
      // Para la vista previa en pantalla, CSS en React
      return { 
        clipPath: maskType === 'flower' ? `path("${flowerPath}")` : undefined, // Splash doesn't scale well with path() in CSS
        WebkitMaskImage: maskType === 'splash' ? `url('data:image/svg+xml;utf8,<svg viewBox="-115 -115 230 230" xmlns="http://www.w3.org/2000/svg"><path d="${splashPath}" fill="black"/></svg>')` : undefined,
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
      };
    default:
      return {};
  }
};

export const drawMaskToCanvas = (ctx: CanvasRenderingContext2D, type: MaskType, w: number, h: number) => {
  ctx.beginPath();
  switch (type) {
    case 'circle':
      ctx.arc(w/2, h/2, Math.min(w,h)/2, 0, Math.PI * 2);
      break;
    case 'diamond':
      ctx.moveTo(w/2, 0); ctx.lineTo(w, h/2); ctx.lineTo(w/2, h); ctx.lineTo(0, h/2);
      break;
    case 'star':
      const cx = w/2, cy = h/2, outerRad = Math.min(w,h)/2, innerRad = outerRad * 0.4;
      for (let i = 0; i < 5; i++) {
        const ang1 = (Math.PI / 2) - (i * 2 * Math.PI / 5);
        const ang2 = ang1 - (Math.PI / 5);
        ctx.lineTo(cx + Math.cos(ang1) * outerRad, cy - Math.sin(ang1) * outerRad);
        ctx.lineTo(cx + Math.cos(ang2) * innerRad, cy - Math.sin(ang2) * innerRad);
      }
      break;
    case 'heart':
      ctx.moveTo(w/2, h * 0.8);
      ctx.bezierCurveTo(w * 0.1, h * 0.5, w * 0.05, h * 0.15, w * 0.25, h * 0.1);
      ctx.bezierCurveTo(w * 0.4, h * 0.05, w/2, h * 0.25, w/2, h * 0.25);
      ctx.bezierCurveTo(w/2, h * 0.25, w * 0.6, h * 0.05, w * 0.75, h * 0.1);
      ctx.bezierCurveTo(w * 0.95, h * 0.15, w * 0.9, h * 0.5, w/2, h * 0.8);
      break;
    case 'flower':
      // Flor simple de 8 pétalos
      const numPetals = 8;
      const fRad = Math.min(w,h)/2;
      for(let i = 0; i <= 360; i += 1) {
        const a = i * Math.PI / 180;
        const r = fRad * (0.7 + 0.3 * Math.sin(numPetals * a));
        if(i===0) ctx.moveTo(w/2 + r*Math.cos(a), h/2 + r*Math.sin(a));
        else ctx.lineTo(w/2 + r*Math.cos(a), h/2 + r*Math.sin(a));
      }
      break;
    case 'splash':
      // Splash/Blob irregular usando ondas seno
      const sRad = Math.min(w,h)/2;
      for(let i = 0; i <= 360; i += 2) {
        const a = i * Math.PI / 180;
        const r = sRad * (0.8 + 0.15 * Math.sin(5*a) + 0.1 * Math.cos(7*a+1) + 0.05 * Math.sin(11*a));
        if(i===0) ctx.moveTo(w/2 + r*Math.cos(a), h/2 + r*Math.sin(a));
        else ctx.lineTo(w/2 + r*Math.cos(a), h/2 + r*Math.sin(a));
      }
      break;
    default:
      ctx.rect(0,0,w,h);
      break;
  }
  ctx.closePath();
};
