#!/usr/bin/env bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/booty_db_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup from container 'tbr_postgres'..."
docker exec -t tbr_postgres pg_dump -U postgres booty_db | gzip > "$FILENAME"

echo "Backup created successfully: $FILENAME"
echo "File size: $(ls -lh "$FILENAME" | awk '{print $5}')"
