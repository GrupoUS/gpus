#!/usr/bin/env python3
"""
Test all validation scripts and report their status
"""

import subprocess
import sys
from pathlib import Path

def run_script_test(script_path, args=None):
    """Run a script and return result"""
    try:
        cmd = [sys.executable, str(script_path)]
        if args:
            cmd.extend(args)
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        return {
            'success': result.returncode == 0,
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': 'Script timed out after 30 seconds'
        }
    except Exception as e:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': str(e)
        }

def main():
    """Test all validation scripts"""
    print("Testing All Droid Skills Validation Scripts")
    print("=" * 50)
    
    scripts_dir = Path(__file__).parent
    skills_dir = scripts_dir.parent
    project_dir = skills_dir.parent
    
    scripts_to_test = [
        {
            'name': 'Simple Skill Validator',
            'path': scripts_dir / 'skill_validator_simple.py',
            'args': [str(skills_dir / 'aegis-architect')],
            'expected': 'Should succeed and report grade A or B'
        },
        {
            'name': 'Brazilian Compliance Validator', 
            'path': skills_dir / 'brazilian-fintech-compliance' / 'scripts' / 'compliance-validator.py',
            'args': [str(project_dir)],
            'expected': 'Should analyze and provide compliance report'
        },
        {
            'name': 'aegis-architect Skill Validation',
            'path': scripts_dir / 'skill_validator_simple.py',
            'args': [str(skills_dir / 'aegis-architect')],
            'expected': 'Should succeed with grade B (good)'
        },
        {
            'name': 'skill-creator Validation',
            'path': scripts_dir / 'skill_validator_simple.py', 
            'args': [str(skills_dir / 'skill-creator')],
            'expected': 'Should succeed with grade A (excellent)'
        },
        {
            'name': 'webapp-testing Validation',
            'path': scripts_dir / 'skill_validator_simple.py',
            'args': [str(skills_dir / 'webapp-testing')],
            'expected': 'Should succeed with grade A (excellent)'
        },
        {
            'name': 'brazilian-fintech-compliance Validation',
            'path': scripts_dir / 'skill_validator_simple.py',
            'args': [str(skills_dir / 'brazilian-fintech-compliance')],
            'expected': 'Should succeed with grade A (excellent)'
        }
    ]
    
    results = []
    
    for script_info in scripts_to_test:
        print(f"\nTesting: {script_info['name']}")
        print(f"Script: {script_info['path']}")
        print(f"Expected: {script_info['expected']}")
        print("-" * 30)
        
        if not script_info['path'].exists():
            print(f"NOT FOUND: Script not found: {script_info['path']}")
            results.append({
                'name': script_info['name'],
                'status': 'NOT_FOUND',
                'path': str(script_info['path'])
            })
            continue
        
        result = run_script_test(script_info['path'], script_info['args'])
        
        if result['success']:
            print("SUCCESS: Script executed successfully")
            if result['stdout']:
                print("Output:")
                print(result['stdout'][:500] + ("..." if len(result['stdout']) > 500 else ""))
        else:
            print(f"FAILED: Script failed with return code: {result['returncode']}")
            if result['stderr']:
                print("Error:")
                print(result['stderr'])
            if result['stdout']:
                print("Output:")
                print(result['stdout'])
        
        results.append({
            'name': script_info['name'],
            'status': 'SUCCESS' if result['success'] else 'FAILED',
            'path': str(script_info['path']),
            'returncode': result['returncode'],
            'output': result['stdout'][:200] if result['stdout'] else '',
            'error': result['stderr'][:200] if result['stderr'] else ''
        })
    
    # Summary Report
    print("\n" + "=" * 50)
    print("SUMMARY REPORT")
    print("=" * 50)
    
    success_count = sum(1 for r in results if r['status'] == 'SUCCESS')
    total_count = len(results)
    
    print(f"Total Scripts Tested: {total_count}")
    print(f"Successful: {success_count}")
    print(f"Failed: {total_count - success_count}")
    print(f"Success Rate: {(success_count / total_count) * 100:.1f}%")
    
    print("\nDetailed Results:")
    for result in results:
        status_icon = "OK" if result['status'] == 'SUCCESS' else "FAIL"
        print(f"[{status_icon}] {result['name']}: {result['status']}")
        if result['status'] == 'FAILED':
            print(f"    Error: {result['error'][:100]}...")
    
    # Overall Status
    print("\n" + "=" * 50)
    if success_count == total_count:
        print("SUCCESS: ALL SCRIPTS WORKING CORRECTLY!")
        print("The Droid Skills validation system is fully functional.")
        sys.exit(0)
    elif success_count > total_count / 2:
        print("WARNING: MOST SCRIPTS WORKING - Some issues need attention")
        sys.exit(1)
    else:
        print("ERROR: SCRIPTS HAVE MAJOR ISSUES - Immediate attention required")
        sys.exit(2)

if __name__ == '__main__':
    main()
