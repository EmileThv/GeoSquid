#!/usr/bin/env bash
# Downloads all raw data sources into data-prep/raw/. Run with: npm run download
# raw/ is not committed to git (too big); this script recreates it.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p raw/ibge raw/municipios raw/cep

# IBGE 2025 outlines: municipalities, states (UF), macro-regions. Official, open data.
IBGE=https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil
for f in BR_Municipios_2025 BR_UF_2025 BR_Regioes_2025; do
  curl -sS --fail --retry 3 -o "raw/ibge/$f.zip" "$IBGE/$f.zip"
  unzip -o -q "raw/ibge/$f.zip" -d "raw/ibge/$f"
  rm "raw/ibge/$f.zip"
done

# Municipality list with area code (DDD), keyed by IBGE code. MIT license.
# https://github.com/kelvins/Municipios-Brasileiros
KELVINS=https://raw.githubusercontent.com/kelvins/Municipios-Brasileiros/main
curl -sS --fail -o raw/municipios/municipios.csv "$KELVINS/csv/municipios.csv"
curl -sS --fail -o raw/municipios/estados.csv "$KELVINS/csv/estados.csv"
curl -sS --fail -o raw/municipios/LICENSE "$KELVINS/LICENSE"

# Postcode (CEP) ranges per municipality, based on Correios data. "Free for any purpose".
# https://github.com/Maahzuka/database-CEPS
MAAH=https://raw.githubusercontent.com/Maahzuka/database-CEPS/main
curl -sS --fail -o raw/cep/ceps.xlsx "$MAAH/ceps.xlsx"
curl -sS --fail -o raw/cep/README.md "$MAAH/README.md"
# mapshaper can't read Excel: convert to CSV (needs: pip install openpyxl)
python3 -I -c '
import csv, openpyxl
ws = openpyxl.load_workbook("raw/cep/ceps.xlsx", read_only=True).active
with open("raw/cep/ceps.csv", "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows(ws.iter_rows(values_only=True))
'
echo "Done. Raw data is in data-prep/raw/"
