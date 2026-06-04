import re

# Leer archivo
with open("municipios.sql", "r", encoding="utf-8") as f:
    content = f.read()

# Reemplazar ",numero)" por ",1)"
new_content = re.sub(r",\d+\)", ",1, now(), now())", content)
new_content = re.sub(r"\((\d+),", r"('\1',", new_content)

# Guardar resultado
with open("municipios_fixed.sql", "w", encoding="utf-8") as f:
    f.write(new_content)

print("✅ Archivo generado: municipios_fixed.sql")