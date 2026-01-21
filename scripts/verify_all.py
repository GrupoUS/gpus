#!/usr/bin/env python3
"""
Verify All Script
Runs the full compliance checklist.
"""

import sys
import subprocess
from pathlib import Path

def main():
    # Resolve the checklist script relative to this script
    current_dir = Path(__file__).parent
    checklist_script = current_dir / "checklist.py"
    
    if not checklist_script.exists():
        print(f"Error: Could not find checklist.py at {checklist_script}")
        sys.exit(1)

    print("🚀 Starting Full System Verification...")
    
    cmd = [sys.executable, str(checklist_script), "."]
    
    # Forward any extra args
    if len(sys.argv) > 1:
        cmd.extend(sys.argv[1:])

    try:
        proc = subprocess.run(cmd, cwd=str(current_dir.parent))
        sys.exit(proc.returncode)
    except Exception as e:
        print(f"Execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
