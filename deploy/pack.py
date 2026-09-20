from __future__ import annotations

import os
import tarfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = Path(__file__).resolve().parent / "secrets" / "codemuscle-src.tar.gz"
out.parent.mkdir(parents=True, exist_ok=True)

skip_dirs = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    ".cursor",
    ".turbo",
    "secrets",
}
skip_files = {
    ".env",
    ".env.deploy",
    "Hubpoint_Infrastructure_CICD_Server_Operations_Runbook.md",
    "codemuscle-src.tar.gz",
}


def skip_name(name: str) -> bool:
    if name in skip_files:
        return True
    if name.startswith("pytest-cache-files-"):
        return True
    if name.endswith(".tsbuildinfo"):
        return True
    if name.startswith("deployment-") and name.endswith(".tar.gz"):
        return True
    if name.endswith(".log"):
        return True
    if name.endswith("_key") or name.endswith(".pem"):
        return True
    return False


count = 0
with tarfile.open(out, "w:gz") as tar:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [
            d
            for d in dirnames
            if d not in skip_dirs and not d.startswith("pytest-cache-files-")
        ]
        rel_dir = os.path.relpath(dirpath, root)
        for filename in filenames:
            if skip_name(filename):
                continue
            full = Path(dirpath) / filename
            arc = filename if rel_dir == "." else str(Path(rel_dir) / filename)
            tar.add(full, arcname=arc.replace("\\", "/"), recursive=False)
            count += 1

print(f"packed {count} files -> {out} ({out.stat().st_size} bytes)")
