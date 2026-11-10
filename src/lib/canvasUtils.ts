/**
 * Utilidades para renderizado en Canvas 2D
 */

/**
 * Divide un texto en líneas para que se ajuste a un ancho máximo (maxWidth).
 * Respeta saltos de línea explícitos (\n), saltos entre palabras y divide
 * palabras excesivamente largas para evitar desbordamientos.
 */
export function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];

  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        // Si ya teníamos texto en la línea, lo guardamos y evaluamos la palabra en una nueva línea
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }

        // Si la palabra sola cabe en la línea:
        if (ctx.measureText(word).width <= maxWidth) {
          currentLine = word;
        } else {
          // Si la palabra sola es más ancha que maxWidth, dividir por caracteres
          let subWord = '';
          for (const char of word) {
            if (ctx.measureText(subWord + char).width <= maxWidth) {
              subWord += char;
            } else {
              if (subWord) lines.push(subWord);
              subWord = char;
            }
          }
          currentLine = subWord;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Dibuja un texto multilínea con wrapping automático y centrado vertical y horizontal.
 * startY se calcula para que el bloque completo de texto quede centrado exactamente en el punto (x, y).
 */
export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const lines = getWrappedLines(ctx, text, maxWidth);
  if (lines.length === 0) return;

  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = y - totalHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + (i * lineHeight));
  });
}
