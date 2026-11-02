#!/usr/bin/env bash
# ==============================================================================
# Script de Respaldo Cifrado de Base de Datos - Taller de Torno Morales López
# Cumplimiento Issue 2.4: Respaldo de PostgreSQL 16 y Bitácora de Auditoría
# Algoritmo de Cifrado en Reposo: AES-256-CBC con salt y PBKDF2 (OpenSSL)
# ==============================================================================

set -euo pipefail

# 1. Validación de variables obligatorias
if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "❌ ERROR DE SEGURIDAD: La variable de entorno 'BACKUP_ENCRYPTION_KEY' no está definida." >&2
  echo "   Defina la clave de cifrado simétrico antes de ejecutar este script:" >&2
  echo "   export BACKUP_ENCRYPTION_KEY=\"su_clave_maestra_segura_2026\"" >&2
  exit 1
fi

# 2. Parámetros de conexión y contenedor
CONTAINER_NAME="${POSTGRES_CONTAINER:-tornomorales-postgres}"
DB_NAME="${POSTGRES_DB:-tornomorales_rrhh}"
DB_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_OUTPUT_DIR:-./backups}"

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

FECHA=$(date +%F)
NOMBRE_ARCHIVO="torno_morales_backup_${FECHA}.sql.enc"
RUTA_SALIDA="${BACKUP_DIR}/${NOMBRE_ARCHIVO}"

echo "=============================================================================="
echo "🛡️  INICIANDO RESPALDO CIFRADO ZERO TRUST - SISTEMA RRHH TORNO MORALES"
echo "=============================================================================="
echo "📅 Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🐳 Contenedor: ${CONTAINER_NAME}"
echo "🗄️  Base de Datos: ${DB_NAME} (Usuario: ${DB_USER})"
echo "🔒 Archivo de Salida: ${RUTA_SALIDA}"
echo "🔐 Cifrado: AES-256-CBC (Salted, PBKDF2 digest SHA256)"
echo "------------------------------------------------------------------------------"

# 3. Ejecución de pg_dump canalizado directamente hacia openssl enc
# La clave se lee de forma segura desde la variable de entorno para no exponerla en ps
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -out "${RUTA_SALIDA}"

# Asegurar permisos restrictivos en el archivo cifrado (solo lectura para el dueño)
chmod 600 "${RUTA_SALIDA}" 2>/dev/null || true

# Copia de conveniencia en la raíz si se ejecuta localmente
if [ "$BACKUP_DIR" != "." ]; then
  cp "${RUTA_SALIDA}" "./${NOMBRE_ARCHIVO}" 2>/dev/null || true
fi

echo "✅ RESPALDO GENERADO Y CIFRADO EXITOSAMENTE:"
ls -lh "${RUTA_SALIDA}"
echo "=============================================================================="
echo "ℹ️  Para restaurar este respaldo cifrado en caso de contingencia:"
echo "   openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in ${RUTA_SALIDA} | docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}"
echo "=============================================================================="
