import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

class DatabaseBackupService:
    def __init__(self):
        self.host = os.getenv("BACKUP_DB_HOST", "host.docker.internal")
        self.port = os.getenv("BACKUP_DB_PORT", "5433")
        self.database = os.getenv("BACKUP_DB_NAME")
        self.username = os.getenv("BACKUP_DB_USER")
        self.password = os.getenv("BACKUP_DB_PASSWORD")

        self.backup_dir = Path(os.getenv("BACKUP_DIR", "/app/backups"))

    def validate_configuration(self):
        required = {
            "BACKUP_DB_NAME": self.database,
            "BACKUP_DB_USER": self.username,
            "BACKUP_DB_PASSWORD": self.password
        }

        missing = [key for key, value in required.items() if not value]

        if missing:
            raise RuntimeError("Database backup configuration missing: " + ", ".join(missing))
        
    def create_backup(self) -> Path:
        self.validate_configuration()

        self.backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

        backup_file = self.backup_dir / f"{self.database}_{timestamp}.dump"

        env = os.environ.copy()

        env["PGPASSWORD"] = self.password

        command = [
            "pg_dump", "--host", self.host, "--port", self.port, "--username", self.username, "--dbname",
            self.database, "--format=custom", "--blobs", "--file", str(backup_file),
        ]

        print(f"[DB BACKUP] Starting backup {self.database}@{self.host}:{self.port}")

        try:
            result = subprocess.run(command, env=env, capture_output=True, text=True, check=False)

        except FileNotFoundError as exc:
            raise RuntimeError("pg_dump was not found inside the application container. Install PostgreSQL client.") from exc

        if result.returncode != 0:
            if backup_file.exists():
                backup_file.unlink(missing_ok=True)

            raise RuntimeError("Database Sync Failed: " + (result.stderr.strip() or "Unknown pg_dump error"))

        if not backup_file.exists():
            raise RuntimeError("pg_dump reported success, but the backup file was not created.")

        file_size = backup_file.stat().st_size

        if file_size == 0:
            backup_file.unlink(missing_ok=True)

            raise RuntimeError("Database backup was created but is empty.")

        print(f"[DB BACKUP] Successful: {backup_file} ({file_size:,} bytes)")

        return backup_file

DB_BACKUP_SERVICE = DatabaseBackupService()