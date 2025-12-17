#!/usr/bin/env python3
"""
Simple skill validator without external dependencies
Validates skills against Factory AI best practices
"""

import os
import re
import json
from pathlib import Path

def validate_skill(skill_path: str):
    """Comprehensive skill validation"""
    skill_path = Path(skill_path)
    
    if not skill_path.exists():
        return {'error': f'Skill directory not found: {skill_path}'}
    
    print(f"Validating skill: {skill_path.name}")
    
    results = {
        'frontmatter': {'status': 'unknown'},
        'structure': {'status': 'unknown'},
        'overall_score': 0
    }
    
    # Validate frontmatter
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        results['frontmatter']['error'] = 'SKILL.md not found'
        results['frontmatter']['status'] = 'invalid'
    else:
        try:
            content = skill_md.read_text(encoding='utf-8')
            
            # Check for YAML frontmatter
            if not content.startswith('---'):
                results['frontmatter']['error'] = 'No YAML frontmatter found'
                results['frontmatter']['status'] = 'invalid'
            else:
                # Extract frontmatter
                frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
                if not frontmatter_match:
                    results['frontmatter']['error'] = 'Invalid frontmatter format'
                    results['frontmatter']['status'] = 'invalid'
                else:
                    frontmatter_text = frontmatter_match.group(1)
                    
                    # Validate required fields
                    missing_required = []
                    if 'name:' not in frontmatter_text:
                        missing_required.append('name')
                    if 'description:' not in frontmatter_text:
                        missing_required.append('description')
                    
                    if missing_required:
                        results['frontmatter']['missing_required'] = missing_required
                        results['frontmatter']['status'] = 'needs_improvement'
                    else:
                        # Validate name format
                        name_match = re.search(r'name:\s*(.+)', frontmatter_text)
                        if name_match:
                            name = name_match.group(1).strip()
                            if not re.match(r'^[a-z0-9-]+$', name):
                                results['frontmatter']['name_format_error'] = 'Name must be hyphen-case'
                                results['frontmatter']['status'] = 'needs_improvement'
                            elif name != skill_path.name:
                                results['frontmatter']['name_mismatch'] = 'Name must match directory name'
                                results['frontmatter']['status'] = 'needs_improvement'
                            else:
                                results['frontmatter']['status'] = 'valid'
                        else:
                            results['frontmatter']['status'] = 'needs_improvement'
                            
        except Exception as e:
            results['frontmatter']['error'] = f'Unexpected error: {e}'
            results['frontmatter']['status'] = 'invalid'
    
    # Validate structure
    if skill_md.exists():
        content = skill_md.read_text(encoding='utf-8')
        lines = len(content.split('\n'))
        
        if lines > 500:
            results['structure']['too_long'] = f'SKILL.md is {lines} lines (recommended: <500)'
            results['structure']['recommendation'] = 'Consider moving detailed content to references/'
            results['structure']['status'] = 'needs_improvement'
        else:
            results['structure']['line_count'] = lines
            results['structure']['status'] = 'valid'
    else:
        results['structure']['status'] = 'invalid'
    
    # Check for optional directories
    optional_dirs = ['references', 'scripts', 'assets', 'examples']
    existing_optional = []
    for dir_name in optional_dirs:
        if (skill_path / dir_name).exists() and (skill_path / dir_name).is_dir():
            existing_optional.append(dir_name)
    
    results['structure']['optional_structure'] = existing_optional
    
    # Calculate simple score
    score = 0
    max_score = 100
    
    # Frontmatter (40%)
    if results['frontmatter']['status'] == 'valid':
        score += 40
    elif results['frontmatter']['status'] == 'needs_improvement':
        score += 25
    
    # Structure (40%)
    if results['structure']['status'] == 'valid':
        score += 40
    elif results['structure']['status'] == 'needs_improvement':
        score += 25
    
    # Optional structure (20%)
    if len(existing_optional) >= 2:
        score += 20
    elif len(existing_optional) >= 1:
        score += 10
    
    results['overall_score'] = score
    results['grade'] = get_grade(score)
    
    return results

def get_grade(score: int) -> str:
    """Get letter grade based on score"""
    if score >= 90:
        return 'A (Excellent)'
    elif score >= 80:
        return 'B (Good)'
    elif score >= 70:
        return 'C (Acceptable)'
    elif score >= 60:
        return 'D (Needs Improvement)'
    else:
        return 'F (Significant Issues)'

def print_report(results, skill_name):
    """Print validation report"""
    print(f"\nSKILL VALIDATION REPORT: {skill_name}")
    print("="*50)
    print(f"Overall Score: {results['overall_score']}/100")
    print(f"Grade: {results['grade']}")
    print("="*50)
    
    # Frontmatter results
    print(f"\nFrontmatter Validation:")
    if 'error' in results['frontmatter']:
        print(f"  ERROR: {results['frontmatter']['error']}")
    else:
        print(f"  Status: {results['frontmatter']['status']}")
        if 'missing_required' in results['frontmatter']:
            print(f"  Missing required fields: {results['frontmatter']['missing_required']}")
        if 'name_format_error' in results['frontmatter']:
            print(f"  Name format error: {results['frontmatter']['name_format_error']}")
        if 'name_mismatch' in results['frontmatter']:
            print(f"  Name mismatch: {results['frontmatter']['name_mismatch']}")
    
    # Structure results
    print(f"\nStructure Validation:")
    if 'error' in results.get('structure', {}):
        print(f"  ERROR: {results['structure']['error']}")
    else:
        print(f"  Status: {results['structure']['status']}")
        if 'line_count' in results['structure']:
            print(f"  SKILL.md lines: {results['structure']['line_count']}")
        if 'too_long' in results['structure']:
            print(f"  WARNING: {results['structure']['too_long']}")
            print(f"  RECOMMENDATION: {results['structure']['recommendation']}")
        if results['structure'].get('optional_structure'):
            print(f"  Optional structure: {', '.join(results['structure']['optional_structure'])}")
    
    print(f"\nOverall Grade: {results['grade']}")

def main():
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python skill_validator_simple.py <skill_directory>")
        sys.exit(1)
    
    results = validate_skill(sys.argv[1])
    
    if 'error' in results:
        print(f"❌ Validation error: {results['error']}")
        sys.exit(1)
    
    print_report(results, Path(sys.argv[1]).name)
    
    # Exit with appropriate code
    score = results['overall_score']
    if score >= 80:
        sys.exit(0)  # Success
    elif score >= 60:
        sys.exit(1)  # Warning
    else:
        sys.exit(2)  # Error

if __name__ == '__main__':
    main()
