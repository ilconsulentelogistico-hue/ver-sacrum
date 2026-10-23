#!/usr/bin/env python3
"""Create a local, reviewable static build. This script never uploads anything."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_SUFFIXES = {".js", ".mjs", ".css", ".html", ".webmanifest"}
ASSET_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".woff", ".woff2", ".json"}


def tracked_files() -> list[Path]:
    raw = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    result = []
    for item in raw.split(b"\0"):
        if not item:
            continue
        relative = Path(item.decode())
        if len(relative.parts) == 1 and relative.suffix in RUNTIME_SUFFIXES:
            result.append(relative)
        elif relative.parts[0] == "assets" and "sources" not in relative.parts and relative.suffix in ASSET_SUFFIXES:
            result.append(relative)
    return sorted(result)


def verify_references(files: list[Path]) -> None:
    names = {path.as_posix() for path in files}
    html = (ROOT / "index.html").read_text()
    service_worker = (ROOT / "sw.js").read_text()
    references = re.findall(r'(?:src|href)=["\'](\./[^"\']+)', html)
    references += re.findall(r"'(\./[^']+)'", service_worker.split("const ASSETS=", 1)[1].split("];", 1)[0])
    missing = sorted({ref.split("?", 1)[0].removeprefix("./") for ref in references if ref != "./"} - names)
    if missing:
        raise SystemExit(f"Missing runtime files: {missing}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path, help="destination ZIP outside the repository")
    args = parser.parse_args()
    files = tracked_files()
    verify_references(files)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    inventory = {path.as_posix(): hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in files}
    info = {"project": "Ver Sacrum", "commit": commit, "files": inventory, "published": False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        def add(name: str, data: bytes) -> None:
            entry = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            bundle.writestr(entry, data, compresslevel=9)
        for path in files:
            add(path.as_posix(), (ROOT / path).read_bytes())
        add("bundle-info.json", (json.dumps(info, indent=2, ensure_ascii=False) + "\n").encode())
    with zipfile.ZipFile(args.output) as bundle:
        bad = bundle.testzip()
        if bad:
            raise SystemExit(f"Corrupt ZIP entry: {bad}")
        if set(bundle.namelist()) != set(inventory) | {"bundle-info.json"}:
            raise SystemExit("ZIP inventory mismatch")
    summary = {"commit": commit, "runtimeFiles": len(files), "zipBytes": args.output.stat().st_size,
               "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest(), "path": str(args.output)}
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
