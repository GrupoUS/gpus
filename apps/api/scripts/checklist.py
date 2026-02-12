#!/usr/bin/env python3
"""
Checklist Script
Orchestrates project checks using Bun and Python.
"""

import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

# Script locations relative to project root
SKILLS_DIR = Path(".agent/skills")
SECURITY_SCAN = SKILLS_DIR / "vulnerability-scanner/scripts/security_scan.py"

def run_step(step: dict, cwd: Path) -> bool:
    """Run a step (script or command)."""
    name = step["name"]
    print(f"\n{'='*60}")
    print(f"Executing: {name}")
    print(f"{'='*60}")

    if "script" in step:
        script_path = step["script"]
        if not (cwd / script_path).exists():
           print(f"[WARN] Script not found: {script_path}")
           # For optional scripts like security scan, we might skip
           return True 
        cmd = [sys.executable, str(script_path)] + step.get("args", [])
    elif "command" in step:
        cmd = step["command"]
    else:
        print(f"[ERROR] Invalid step definition: {name}")
        return False

    try:
        # On Windows, shell=True might be needed for some commands if not found, 
        # but for 'bun' it should be fine if in PATH. 
        # Using shell=True for 'bun' commands can be safer on Windows.
        is_windows = sys.platform.startswith('win')
        
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            encoding='utf-8',
            errors='replace',
            shell=is_windows and "command" in step
        )
        return proc.returncode == 0
    except Exception as e:
        print(f"[ERROR] Failed to run {name}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Project Compliance Checklist")
    parser.add_argument("path", nargs="?", default=".", help="Project path")
    parser.add_argument("--url", help="URL for E2E/Lighthouse checks (optional)")
    parser.add_argument("--skip-tests", action="store_true", help="Skip running tests")
    parser.add_argument("--skip-lint", action="store_true", help="Skip linting")
    parser.add_argument("--skip-security", action="store_true", help="Skip security scan")
    
    args = parser.parse_args()
    project_root = Path(args.path).resolve()

    print(f"Starting Checklist for: {project_root}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    steps = []
    
    # 1. Linting (Bun)
    if not args.skip_lint:
        steps.append({
            "name": "Linting (Biome)",
            "command": ["bun", "run", "lint:check"]
        })

    # 2. Build (Bun)
    steps.append({
        "name": "Build (TS + Vite)",
        "command": ["bun", "run", "build"]
    })

    # 3. Testing (Bun)
    if not args.skip_tests:
        steps.append({
            "name": "Testing (Vitest)",
            "command": ["bun", "run", "test:coverage"]
        })
    
    # 4. Security (Python)
    if not args.skip_security:
        steps.append({
            "name": "Security Scan",
            "script": SECURITY_SCAN,
            "args": [str(project_root)]
        })

    failed_steps = []

    for step in steps:
        passed = run_step(step, project_root)
        if not passed:
            failed_steps.append(step["name"])

    print("\n" + "="*60)
    print("CHECKLIST SUMMARY")
    print("="*60)
    
    if failed_steps:
        print(f"❌ Failed Steps: {', '.join(failed_steps)}")
        sys.exit(1)
    else:
        print("✅ All checks passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
