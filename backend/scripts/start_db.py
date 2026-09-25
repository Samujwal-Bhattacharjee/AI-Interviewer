"""
backend/scripts/start_db.py — Local development PostgreSQL runner for Windows.

Usage:
    python scripts/start_db.py          # Starts postgres server on port 5432
    python scripts/start_db.py stop     # Stops the running postgres server
    python scripts/start_db.py status   # Checks if postgres is running
"""
import os
import socket
import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
PGDATA_DIR = BACKEND_DIR / ".pgdata"
LOG_FILE = PGDATA_DIR / "server.log"


def find_postgres_bin() -> Path | None:
    """Finds postgres binaries from pgserver package or PATH."""
    try:
        import pgserver._commands as cmd
        if cmd.POSTGRES_BIN_PATH.exists():
            return cmd.POSTGRES_BIN_PATH
    except ImportError:
        pass

    # Check common system paths
    for p in os.environ.get("PATH", "").split(os.pathsep):
        candidate = Path(p) / ("postgres.exe" if os.name == "nt" else "postgres")
        if candidate.exists():
            return candidate.parent

    for version in [17, 16, 15, 14]:
        candidate = Path(f"C:/Program Files/PostgreSQL/{version}/bin")
        if candidate.exists():
            return candidate

    return None


def is_port_in_use(port: int = 5432, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex((host, port)) == 0


def status_server(bin_dir: Path) -> None:
    if is_port_in_use(5432):
        print("PostgreSQL is currently RUNNING on localhost:5432.")
    else:
        print("PostgreSQL is NOT running on localhost:5432.")


def stop_server(bin_dir: Path) -> None:
    pg_ctl = bin_dir / ("pg_ctl.exe" if os.name == "nt" else "pg_ctl")
    if PGDATA_DIR.exists() and pg_ctl.exists():
        subprocess.run([str(pg_ctl), "-D", str(PGDATA_DIR), "stop"], check=False)
        print("PostgreSQL stop signal sent.")
    else:
        print(f"Data directory {PGDATA_DIR} or pg_ctl not found.")


def start_server(bin_dir: Path) -> None:
    if is_port_in_use(5432):
        print("PostgreSQL is already active and listening on localhost:5432.")
        return

    initdb = bin_dir / ("initdb.exe" if os.name == "nt" else "initdb")
    createdb = bin_dir / ("createdb.exe" if os.name == "nt" else "createdb")
    pg_ctl = bin_dir / ("pg_ctl.exe" if os.name == "nt" else "pg_ctl")
    psql = bin_dir / ("psql.exe" if os.name == "nt" else "psql")

    # 1. Initialize cluster if needed
    if not PGDATA_DIR.exists() or not (PGDATA_DIR / "PG_VERSION").exists():
        print(f"Initializing database cluster in {PGDATA_DIR}...")
        PGDATA_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [str(initdb), "-D", str(PGDATA_DIR), "-U", "postgres", "-E", "UTF8", "--auth=trust"],
            check=True,
        )

    # 2. Start server
    print("Starting PostgreSQL server on port 5432...")
    subprocess.run(
        [str(pg_ctl), "-D", str(PGDATA_DIR), "-l", str(LOG_FILE), "-o", "-p 5432", "start"],
        check=True,
    )

    # 3. Create database if not exists
    print("Ensuring database 'aiinterviewer' exists...")
    subprocess.run(
        [str(createdb), "-U", "postgres", "-p", "5432", "-h", "127.0.0.1", "aiinterviewer"],
        capture_output=True,
    )

    # 4. Set password for postgres user
    subprocess.run(
        [
            str(psql),
            "-U", "postgres",
            "-h", "127.0.0.1",
            "-p", "5432",
            "-d", "aiinterviewer",
            "-c", "ALTER USER postgres WITH PASSWORD 'password';",
        ],
        capture_output=True,
    )

    print("\nPostgreSQL is READY!")
    print("Connection string: postgresql+asyncpg://postgres:password@localhost:5432/aiinterviewer")


def main() -> None:
    bin_dir = find_postgres_bin()
    if not bin_dir:
        print("ERROR: Could not locate PostgreSQL binaries.")
        print("Please install pgserver in venv ('pip install pgserver') or install PostgreSQL.")
        sys.exit(1)

    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "start"
    if cmd == "start":
        start_server(bin_dir)
    elif cmd == "stop":
        stop_server(bin_dir)
    elif cmd == "status":
        status_server(bin_dir)
    else:
        print("Unknown command. Usage: python scripts/start_db.py [start|stop|status]")


if __name__ == "__main__":
    main()
