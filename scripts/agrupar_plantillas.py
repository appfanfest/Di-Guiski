#!/usr/bin/env python3
"""
agrupar_plantillas.py  v2
==========================
Lee rutas_plantillas_metaversos.csv y genera experiences_agrupadas.csv
donde cada fila es una PLANTILLA completa con sus archivos componentes
en celdas paralelas.

Lógica por categoría:

  PHOTO BOOTH
    Patrón:  "NOMBRE TT VV.ext"  →  grupo = "NOMBRE TT"
    Las variaciones VV (01-04) van en archivo_1 … archivo_4
    No tiene tapa separada.

  MARCOS PRO / POSTALES WASSAP / MI ALBUM / PDFS
    Paso 1 – Detectar tapas: archivos que contengan TAPA|PORTADA|COVER|OVER|etc.
    Paso 2 – Agrupar marcos por nombre base (quitando sufijo numérico).
    Paso 3 – Unir tapas con sus marcos:
             a) Si el nombre base de la tapa (quitando PORTADA/TAPA del nombre)
                coincide con un grupo de marcos → unir.
             b) Si no coincide → la tapa queda como plantilla independiente.

Columnas de salida:
  metaverso, categoria, nombre_plantilla,
  tapa, ruta_tapa,
  archivo_1 … archivo_N, ruta_1 … ruta_N,
  notas
"""

import csv
import re
import os
from collections import defaultdict

INPUT_CSV  = "rutas_plantillas_metaversos.csv"
OUTPUT_CSV = "experiences_agrupadas.csv"

# ── Palabras que indican que el archivo es la TAPA / PORTADA ─────────────────
TAPA_RE = re.compile(
    r'\b(TAPA|PORTADA|COVER|CONTRAPORTADA|CONTRATAPA|BACK[\s_-]?COVER|BACK)\b',
    re.IGNORECASE
)

# ── Palabras que son descriptores internos (no son tapas pero tampoco numeran) ─
INTERNAL_RE = re.compile(
    r'\b(INTERNA[S]?|INTERNAS|OVER|FONDO|BACK)\b',
    re.IGNORECASE
)

# ── Patrón Photo Booth/Wassap dos-números:  "NOMBRE  TT  VV" ─────────────────
TWO_NUM_RE = re.compile(r'^(.+?)\s+(\d{2})\s+(\d{2,3})$')

# ── Sufijo numérico al final (con separador) ──────────────────────────────────
SUFFIX_NUM_RE = re.compile(r'[\s\-_(](\d{1,2})[)\s]*$')

# ── Paréntesis numerado al final: "NOMBRE (3)" ───────────────────────────────
PAREN_RE = re.compile(r'\s*\(\d+\)\s*$')


def strip_ext(name: str) -> str:
    return os.path.splitext(name)[0]


def is_tapa(stem: str) -> bool:
    return bool(TAPA_RE.search(stem))


def remove_tapa_keyword(stem: str) -> str:
    """Quita la keyword de tapa y posible número asociado del stem."""
    s = re.sub(
        r'[\s\-_]*(TAPA|PORTADA|COVER|CONTRAPORTADA|CONTRATAPA|BACK[\s_-]?COVER|BACK)[\s\-_]*\d*\s*$',
        '', stem, flags=re.IGNORECASE
    ).strip()
    # También intentar al inicio (ej.: "PORTADA BABY BEE")
    s2 = re.sub(
        r'^\s*(TAPA|PORTADA|COVER|CONTRAPORTADA|CONTRATAPA|BACK[\s_-]?COVER|BACK)\s+',
        '', stem, flags=re.IGNORECASE
    ).strip()
    # Usamos la versión más corta (más limpia)
    return (s if len(s) <= len(s2) else s2).upper()


def normalize_base(stem: str) -> str:
    """Nombre base para agrupar: quita sufijo numérico final."""
    s = PAREN_RE.sub('', stem).strip()
    s = SUFFIX_NUM_RE.sub('', s).strip()
    # Quitar guiones/guiones bajos finales
    s = s.rstrip('-_ ')
    return s.upper()


def classify_two_num(stem: str):
    """
    Para patrones "NOMBRE TT VV".
    Devuelve (nombre_tema, tema_str, variacion_str) o None.
    """
    m = TWO_NUM_RE.match(stem)
    if m:
        return m.group(1).strip().upper(), m.group(2), m.group(3)
    return None


def group_category(rows: list) -> list:
    """
    Recibe filas de un mismo (metaverso, categoria).
    Devuelve lista de grupos (dict) listos para el CSV.
    """

    # ── Paso 1: intentar patrón de dos números (Photo Booth, algunos Wassap) ─
    two_num_groups: dict = defaultdict(lambda: defaultdict(list))  # base → var → rows
    singles = []

    for row in rows:
        stem = strip_ext(row['archivo'])
        info = classify_two_num(stem)
        if info:
            base, tema_num, var_num = info
            group_key = f"{base} {tema_num}"
            two_num_groups[group_key][var_num].append(row)
        else:
            singles.append(row)

    result = []

    for group_key in sorted(two_num_groups.keys()):
        variations = two_num_groups[group_key]
        archivos, rutas = [], []
        for var_num in sorted(variations.keys()):
            for row in variations[var_num]:
                archivos.append(row['archivo'])
                rutas.append(row['ruta_completa'])
        result.append({
            'nombre_plantilla': group_key,
            'tapa': '', 'ruta_tapa': '',
            'archivos': archivos, 'rutas': rutas,
            'notas': f'{len(archivos)} variaciones'
        })

    # ── Paso 2: separar tapas de marcos entre los singles ────────────────────
    tapa_rows = [r for r in singles if is_tapa(strip_ext(r['archivo']))]
    marco_rows = [r for r in singles if not is_tapa(strip_ext(r['archivo']))]

    # ── Paso 3: agrupar marcos por nombre base ────────────────────────────────
    marco_groups: dict = defaultdict(list)  # base_upper → rows
    for row in marco_rows:
        base = normalize_base(strip_ext(row['archivo']))
        marco_groups[base].append(row)

    # ── Paso 4: asignar tapas a grupos de marcos ──────────────────────────────
    # Construir índice de bases de tapas → rows
    tapa_assigned: dict = {}  # base_upper de tapa → row

    for trow in tapa_rows:
        stem = strip_ext(trow['archivo'])
        tapa_base = remove_tapa_keyword(stem)   # ej: "BABY BEE"
        # Buscar el grupo de marcos cuyo base_upper == tapa_base
        if tapa_base in marco_groups:
            if tapa_base not in tapa_assigned:
                tapa_assigned[tapa_base] = []
            tapa_assigned[tapa_base].append(trow)
        else:
            # Sin coincidencia directa → intentar búsqueda parcial
            matched = None
            for mbase in marco_groups:
                if tapa_base.startswith(mbase) or mbase.startswith(tapa_base):
                    matched = mbase
                    break
            if matched:
                if matched not in tapa_assigned:
                    tapa_assigned[matched] = []
                tapa_assigned[matched].append(trow)
            else:
                # Sin grupo de marcos → tapa independiente
                if tapa_base not in tapa_assigned:
                    tapa_assigned[tapa_base] = []
                tapa_assigned[tapa_base].append(trow)

    # ── Paso 5: construir grupos finales para marcos ──────────────────────────
    used_tapa_bases = set()

    for base in sorted(marco_groups.keys()):
        m_rows = sorted(marco_groups[base], key=lambda r: r['archivo'])
        t_rows = tapa_assigned.get(base, [])
        used_tapa_bases.add(base)

        # Primera tapa
        tapa_file = t_rows[0]['archivo'] if t_rows else ''
        tapa_ruta  = t_rows[0]['ruta_completa'] if t_rows else ''
        extra_tapas = t_rows[1:]

        archivos = [r['archivo'] for r in m_rows] + [r['archivo'] for r in extra_tapas]
        rutas    = [r['ruta_completa'] for r in m_rows] + [r['ruta_completa'] for r in extra_tapas]

        parts = []
        if tapa_file:
            parts.append('con tapa')
        parts.append(f'{len(m_rows)} archivo(s)')

        result.append({
            'nombre_plantilla': base,
            'tapa': tapa_file, 'ruta_tapa': tapa_ruta,
            'archivos': archivos, 'rutas': rutas,
            'notas': ', '.join(parts)
        })

    # ── Paso 6: tapas sin grupo de marcos ────────────────────────────────────
    for tapa_base, t_rows in sorted(tapa_assigned.items()):
        if tapa_base in used_tapa_bases:
            continue
        # Tapas independientes
        for trow in t_rows:
            stem = strip_ext(trow['archivo'])
            result.append({
                'nombre_plantilla': normalize_base(stem),
                'tapa': trow['archivo'], 'ruta_tapa': trow['ruta_completa'],
                'archivos': [], 'rutas': [],
                'notas': 'solo tapa / portada'
            })

    return result


def main():
    all_rows = []
    with open(INPUT_CSV, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            all_rows.append(row)

    print(f"Filas leidas: {len(all_rows)}")

    # Agrupar por metaverso + categoria
    buckets: dict = defaultdict(list)
    for row in all_rows:
        buckets[(row['metaverso'], row['categoria'])].append(row)

    all_groups = []
    for (metaverso, categoria), rows in sorted(buckets.items()):
        for g in group_category(rows):
            g['metaverso'] = metaverso
            g['categoria'] = categoria
            all_groups.append(g)

    max_archivos = max((len(g['archivos']) for g in all_groups), default=0)
    print(f"Plantillas agrupadas: {len(all_groups)}")
    print(f"Max archivos en una plantilla: {max_archivos}")

    MAX_COLS = max(max_archivos, 12)

    archivo_cols = [f'archivo_{i}' for i in range(1, MAX_COLS + 1)]
    ruta_cols    = [f'ruta_{i}'    for i in range(1, MAX_COLS + 1)]

    fieldnames = (
        ['metaverso', 'categoria', 'nombre_plantilla', 'tapa', 'ruta_tapa']
        + archivo_cols + ruta_cols
        + ['notas']
    )

    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for g in all_groups:
            row = {
                'metaverso':        g['metaverso'],
                'categoria':        g['categoria'],
                'nombre_plantilla': g['nombre_plantilla'],
                'tapa':             g['tapa'],
                'ruta_tapa':        g['ruta_tapa'],
                'notas':            g['notas'],
            }
            for i, (arch, ruta) in enumerate(zip(g['archivos'], g['rutas']), 1):
                row[f'archivo_{i}'] = arch
                row[f'ruta_{i}']    = ruta
            for i in range(len(g['archivos']) + 1, MAX_COLS + 1):
                row[f'archivo_{i}'] = ''
                row[f'ruta_{i}']    = ''
            writer.writerow(row)

    print(f"\n[OK] CSV generado: {OUTPUT_CSV}  ({len(fieldnames)} columnas)")

    # ── Muestra de 15 grupos representativos ──────────────────────────────────
    print("\n--- Muestra ---")
    shown = 0
    for g in all_groups:
        if shown >= 15:
            break
        has_content = g['tapa'] or g['archivos']
        if not has_content:
            continue
        print(f"  [{g['metaverso']}] [{g['categoria']}] -> {g['nombre_plantilla']}")
        if g['tapa']:
            print(f"     TAPA:     {g['tapa']}")
        for i, a in enumerate(g['archivos'][:4], 1):
            print(f"     archivo_{i}: {a}")
        if len(g['archivos']) > 4:
            print(f"     ... +{len(g['archivos'])-4} mas")
        print(f"     [{g['notas']}]")
        shown += 1


if __name__ == '__main__':
    main()
