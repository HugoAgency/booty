#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-db.sh <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '$BACKUP_FILE' not found."
  exit 1
fi

echo "Restoring database into container 'tbr_postgres' from '$BACKUP_FILE'..."
gunzip -c "$BACKUP_FILE" | docker exec -i tbr_postgres psql -U postgres booty_db

echo "Database restored successfully."
