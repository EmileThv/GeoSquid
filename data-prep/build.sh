#!/usr/bin/env bash
# Builds the app's map data from data-prep/raw/. Run with: npm run build
# Output goes to out/ and is copied to web/static/data/brazil/.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out

# 1. All map layers in ONE run, all merged from the same municipality shapes.
#    Because they share the same borders, the layers line up exactly with
#    each other (e.g. state borders drawn on top of area-code zones).
#
#    -join      attach the area code (ddd) to each municipality (by IBGE code)
#    -filter    drop the 2 shapes with no area code (large lakes)
#    -dissolve  merge municipalities that share a value; "+ name=x" keeps the
#               municipalities and creates a new layer x next to them.
#               For area codes: main_state = the state holding most of its
#               municipalities (used for its color on the map)
#    -each      keep each area code's state list unique ("SP,SP,SP" -> "SP")
#    -simplify  keep 2% of the outline points (plenty at screen size);
#               keep-shapes stops small zones from disappearing
#    -o         write the three layers into one TopoJSON file
npx mapshaper-xl raw/ibge/BR_Municipios_2025/BR_Municipios_2025.shp \
  -join raw/municipios/municipios.csv keys=CD_MUN,codigo_ibge string-fields=codigo_ibge fields=ddd \
  -filter 'ddd != null' \
  -dissolve SIGLA_UF copy-fields=NM_UF,SIGLA_RG,NM_REGIAO + name=states \
  -target BR_Municipios_2025 \
  -dissolve SIGLA_RG copy-fields=NM_REGIAO + name=regions \
  -target BR_Municipios_2025 \
  -dissolve ddd calc='states = collect(SIGLA_UF), main_state = mode(SIGLA_UF)' + name=ddd \
  -each 'states = Array.from(new Set(states)).sort().join(",")' target=ddd \
  -simplify 2% keep-shapes \
  -o out/brazil.topojson format=topojson target=states,regions,ddd

# 2. The 27 state capitals as a plain JSON list (no outlines, just points).
npx mapshaper raw/municipios/municipios.csv \
  -filter 'capital == 1' \
  -join raw/municipios/estados.csv keys=codigo_uf,codigo_uf fields=uf \
  -rename-fields name=nome,lat=latitude,lon=longitude \
  -filter-fields name,uf,lat,lon,ddd \
  -o out/capitals.json format=json

# 3. Copy into the app
mkdir -p ../web/static/data/brazil
cp out/brazil.topojson out/capitals.json ../web/static/data/brazil/
echo "Done: web/static/data/brazil/{brazil.topojson,capitals.json}"
