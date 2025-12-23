#!/usr/bin/env python3
"""
Enhanced skill validator with Brazilian market compliance checking
Validates skills against Factory AI best practices and Brazilian standards
"""

import os
import re
import json
import yaml
from pathlib import Path
from datetime import datetime

class EnhancedSkillValidator:
    def __init__(self):
        self.validation_results = {
            'frontmatter': {},
            'structure': {},
            'brazilian_compliance': {},
            'performance': {},
            'security': {},
            'overall_score': 0
        }
        
        self.required_frontmatter_fields = ['name', 'description']
        self.optional_frontmatter_fields = ['license', 'metadata', 'allowed-tools']
        
        # Brazilian market specific checks
        self.brazilian_keywords = [
            'brazilian', 'pix', 'boleto', 'lgpd', 'português', 'portuguese',
            'real', 'reais', 'cpf', 'cnpj', 'finanças', 'financeiro'
        ]
        
        self.security_patterns = [
            'encryption', 'authentication', 'authorization', 'audit', 'logging',
            'data protection', 'privacy', 'security', 'vulnerability'
        ]

    def validate_skill(self, skill_path: str) -> dict:
        """Comprehensive skill validation"""
        skill_path = Path(skill_path)
        
        if not skill_path.exists():
            return {'error': f'Skill directory not found: {skill_path}'}
        
        print(f"🔍 Validating skill: {skill_path.name}")
        
        # Validate frontmatter
        self.validate_frontmatter(skill_path)
        
        # Validate structure
        self.validate_structure(skill_path)
        
        # Brazilian market compliance
        self.validate_brazilian_compliance(skill_path)
        
        # Performance optimization
        self.validate_performance_optimization(skill_path)
        
        # Security compliance
        self.validate_security_compliance(skill_path)
        
        # Calculate overall score
        self.calculate_overall_score()
        
        return self.validation_results

    def validate_frontmatter(self, skill_path: Path):
        """Validate YAML frontmatter in SKILL.md"""
        skill_md = skill_path / 'SKILL.md'
        
        if not skill_md.exists():
            self.validation_results['frontmatter']['error'] = 'SKILL.md not found'
            return
        
        try:
            content = skill_md.read_text(encoding='utf-8')
            
            # Check for YAML frontmatter
            if not content.startswith('---'):
                self.validation_results['frontmatter']['error'] = 'No YAML frontmatter found'
                return
            
            # Extract frontmatter
            frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not frontmatter_match:
                self.validation_results['frontmatter']['error'] = 'Invalid frontmatter format'
                return
            
            frontmatter_text = frontmatter_match.group(1)
            
            try:
                frontmatter = yaml.safe_load(frontmatter_text)
            except yaml.YAMLError as e:
                self.validation_results['frontmatter']['error'] = f'YAML parsing error: {e}'
                return
            
            # Validate required fields
            missing_required = []
            for field in self.required_frontmatter_fields:
                if field not in frontmatter:
                    missing_required.append(field)
            
            if missing_required:
                self.validation_results['frontmatter']['missing_required'] = missing_required
            
            # Validate name field
            if 'name' in frontmatter:
                name = frontmatter['name']
                if not re.match(r'^[a-z0-9-]+$', name):
                    self.validation_results['frontmatter']['name_format_error'] = 'Name must be hyphen-case'
                
                if name != skill_path.name:
                    self.validation_results['frontmatter']['name_mismatch'] = 'Name must match directory name'
            
            # Validate description field
            if 'description' in frontmatter:
                description = frontmatter['description']
                if len(description) > 256:
                    self.validation_results['frontmatter']['description_too_long'] = 'Description should be under 256 characters'
                
                # Check for WHAT + WHEN pattern
                if not any(keyword in description.lower() for keyword in ['use when', 'when to', 'for']):
                    self.validation_results['frontmatter']['description_missing_when'] = 'Description should include when to use'
            
            # Validate optional metadata
            if 'metadata' in frontmatter:
                metadata = frontmatter['metadata']
                if not isinstance(metadata, dict):
                    self.validation_results['frontmatter']['metadata_invalid'] = 'Metadata must be a dictionary'
                else:
                    # Check for recommended metadata fields
                    recommended_fields = ['version', 'author', 'category', 'last-updated']
                    missing_recommended = [field for field in recommended_fields if field not in metadata]
                    if missing_recommended:
                        self.validation_results['frontmatter']['missing_recommended'] = missing_recommended
            
            self.validation_results['frontmatter']['status'] = 'valid'
            
        except Exception as e:
            self.validation_results['frontmatter']['error'] = f'Unexpected error: {e}'

    def validate_structure(self, skill_path: Path):
        """Validate skill directory structure"""
        expected_files = ['SKILL.md']
        optional_dirs = ['references', 'scripts', 'assets', 'examples']
        
        # Check required files
        missing_files = []
        for file in expected_files:
            if not (skill_path / file).exists():
                missing_files.append(file)
        
        if missing_files:
            self.validation_results['structure']['missing_files'] = missing_files
        
        # Check optional directories
        existing_optional = []
        for dir_name in optional_dirs:
            if (skill_path / dir_name).exists() and (skill_path / dir_name).is_dir():
                existing_optional.append(dir_name)
        
        self.validation_results['structure']['optional_structure'] = existing_optional
        
        # Progressive disclosure check
        skill_md = skill_path / 'SKILL.md'
        if skill_md.exists():
            content = skill_md.read_text(encoding='utf-8')
            lines = len(content.split('\n'))
            
            if lines > 500:
                self.validation_results['structure']['too_long'] = f'SKILL.md is {lines} lines (recommended: <500)'
                self.validation_results['structure']['recommendation'] = 'Consider moving detailed content to references/'
        
        self.validation_results['structure']['status'] = 'valid'

    def validate_brazilian_compliance(self, skill_path: Path):
        """Validate Brazilian market specific compliance"""
        content_files = []
        
        # Collect all text content
        for file_path in skill_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in ['.md', '.txt', '.ts', '.js']:
                try:
                    content = file_path.read_text(encoding='utf-8')
                    content_files.append((file_path, content.lower()))
                except:
                    continue
        
        # Check for Brazilian market keywords
        brazilian_content_found = False
        for file_path, content in content_files:
            if any(keyword in content for keyword in self.brazilian_keywords):
                brazilian_content_found = True
                break
        
        if brazilian_content_found:
            self.validation_results['brazilian_compliance']['market_focus'] = 'Brazilian market content found'
        else:
            self.validation_results['brazilian_compliance']['market_focus'] = 'Consider adding Brazilian market specific content'
        
        # Check for LGPD compliance
        lgpd_found = False
        for file_path, content in content_files:
            if 'lgpd' in content or 'lei geral de proteção de dados' in content:
                lgpd_found = True
                break
        
        if lgpd_found:
            self.validation_results['brazilian_compliance']['lgpd'] = 'LGPD compliance content found'
        else:
            self.validation_results['brazilian_compliance']['lgpd'] = 'Consider adding LGPD compliance information'
        
        # Check for Portuguese language support
        portuguese_found = False
        for file_path, content in content_files:
            if 'português' in content or 'portuguese' in content or 'pt-br' in content:
                portuguese_found = True
                break
        
        if portuguese_found:
            self.validation_results['brazilian_compliance']['portuguese'] = 'Portuguese language support found'
        else:
            self.validation_results['brazilian_compliance']['portuguese'] = 'Consider adding Portuguese language support'

    def validate_performance_optimization(self, skill_path: Path):
        """Validate performance optimization patterns"""
        content_files = []
        
        # Collect source code files
        for file_path in skill_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in ['.ts', '.js', '.tsx', '.jsx', '.py']:
                try:
                    content = file_path.read_text(encoding='utf-8')
                    content_files.append((file_path, content.lower()))
                except:
                    continue
        
        # Check for performance patterns
        performance_patterns = [
            'caching', 'lazy loading', 'code splitting', 'optimization',
            'performance', 'benchmark', 'profiling', 'minification'
        ]
        
        performance_found = False
        for file_path, content in content_files:
            if any(pattern in content for pattern in performance_patterns):
                performance_found = True
                break
        
        if performance_found:
            self.validation_results['performance']['optimization'] = 'Performance optimization patterns found'
        else:
            self.validation_results['performance']['optimization'] = 'Consider adding performance optimization patterns'
        
        # Check for voice-specific performance
        voice_performance_patterns = [
            'voice', 'speech', 'recognition', 'synthesis', 'nlp', 'nlu'
        ]
        
        if 'aegis-architect' in str(skill_path):
            voice_found = False
            for file_path, content in content_files:
                if any(pattern in content for pattern in voice_performance_patterns):
                    voice_found = True
                    break
            
            if voice_found:
                self.validation_results['performance']['voice'] = 'Voice performance considerations found'
            else:
                self.validation_results['performance']['voice'] = 'Consider adding voice performance optimizations'

    def validate_security_compliance(self, skill_path: Path):
        """Validate security compliance"""
        content_files = []
        
        # Collect all source files
        for file_path in skill_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in ['.md', '.ts', '.js', '.py']:
                try:
                    content = file_path.read_text(encoding='utf-8')
                    content_files.append((file_path, content.lower()))
                except:
                    continue
        
        # Check for security patterns
        security_found = False
        for file_path, content in content_files:
            if any(pattern in content for pattern in self.security_patterns):
                security_found = True
                break
        
        if security_found:
            self.validation_results['security']['patterns'] = 'Security patterns found'
        else:
            self.validation_results['security']['patterns'] = 'Consider adding security patterns'
        
        # Check for sensitive data handling
        sensitive_patterns = [
            'password', 'secret', 'key', 'token', 'api_key', 'credential'
        ]
        
        sensitive_issues = []
        for file_path, content in content_files:
            # Check for hardcoded secrets (basic pattern)
            if any(f'{pattern}=' in content for pattern in sensitive_patterns):
                if 'example' not in content and 'template' not in content:
                    sensitive_issues.append(str(file_path))
        
        if sensitive_issues:
            self.validation_results['security']['sensitive_data'] = f'Potential hardcoded secrets in: {sensitive_issues}'
        else:
            self.validation_results['security']['sensitive_data'] = 'No obvious hardcoded secrets found'

    def calculate_overall_score(self):
        """Calculate overall validation score"""
        score = 0
        max_score = 0
        
        # Frontmatter scoring (30%)
        max_score += 30
        frontmatter_score = 0
        if 'error' not in self.validation_results['frontmatter']:
            frontmatter_score += 15
            if 'missing_required' not in self.validation_results['frontmatter']:
                frontmatter_score += 10
            if 'missing_recommended' not in self.validation_results['frontmatter']:
                frontmatter_score += 5
        score += frontmatter_score
        
        # Structure scoring (20%)
        max_score += 20
        structure_score = 0
        if 'missing_files' not in self.validation_results['structure']:
            structure_score += 10
        if 'too_long' not in self.validation_results['structure']:
            structure_score += 5
        if self.validation_results['structure'].get('optional_structure'):
            structure_score += 5
        score += structure_score
        
        # Brazilian compliance scoring (25%)
        max_score += 25
        brazilian_score = 0
        if self.validation_results['brazilian_compliance'].get('market_focus') == 'Brazilian market content found':
            brazilian_score += 10
        if self.validation_results['brazilian_compliance'].get('lgpd') == 'LGPD compliance content found':
            brazilian_score += 8
        if self.validation_results['brazilian_compliance'].get('portuguese') == 'Portuguese language support found':
            brazilian_score += 7
        score += brazilian_score
        
        # Performance scoring (15%)
        max_score += 15
        performance_score = 0
        if self.validation_results['performance'].get('optimization') == 'Performance optimization patterns found':
            performance_score += 8
        if self.validation_results['performance'].get('voice') == 'Voice performance considerations found':
            performance_score += 7
        score += performance_score
        
        # Security scoring (10%)
        max_score += 10
        security_score = 0
        if self.validation_results['security'].get('patterns') == 'Security patterns found':
            security_score += 6
        if self.validation_results['security'].get('sensitive_data') == 'No obvious hardcoded secrets found':
            security_score += 4
        score += security_score
        
        self.validation_results['overall_score'] = int((score / max_score) * 100)
        self.validation_results['grade'] = self.get_grade(self.validation_results['overall_score'])
    
    def get_grade(self, score: int) -> str:
        """Get letter grade based on score"""
        if score >= 95:
            return 'A+ (Excellent)'
        elif score >= 90:
            return 'A (Great)'
        elif score >= 85:
            return 'B+ (Good)'
        elif score >= 80:
            return 'B (Acceptable)'
        elif score >= 70:
            return 'C (Needs Improvement)'
        else:
            return 'D (Significant Issues)'

    def print_report(self):
        """Print detailed validation report"""
        print(f"\n📊 ENHANCED SKILL VALIDATION REPORT")
        print(f"{'='*50}")
        print(f"Overall Score: {self.validation_results['overall_score']}/100")
        print(f"Grade: {self.validation_results['grade']}")
        print(f"{'='*50}")
        
        # Frontmatter results
        print(f"\n📋 Frontmatter Validation:")
        if 'error' in self.validation_results['frontmatter']:
            print(f"  ❌ {self.validation_results['frontmatter']['error']}")
        else:
            print(f"  ✅ Frontmatter structure valid")
            if 'missing_required' in self.validation_results['frontmatter']:
                print(f"  ⚠️  Missing required fields: {self.validation_results['frontmatter']['missing_required']}")
            if 'missing_recommended' in self.validation_results['frontmatter']:
                print(f"  💡 Missing recommended metadata: {self.validation_results['frontmatter']['missing_recommended']}")
        
        # Structure results
        print(f"\n🏗️  Structure Validation:")
        if 'missing_files' in self.validation_results['structure']:
            print(f"  ❌ Missing files: {self.validation_results['structure']['missing_files']}")
        else:
            print(f"  ✅ Required files present")
        if 'too_long' in self.validation_results['structure']:
            print(f"  ⚠️  {self.validation_results['structure']['too_long']}")
        if self.validation_results['structure'].get('optional_structure'):
            print(f"  ✅ Optional structure: {', '.join(self.validation_results['structure']['optional_structure'])}")
        
        # Brazilian compliance results
        print(f"\n🇧🇷 Brazilian Market Compliance:")
        print(f"  {self.validation_results['brazilian_compliance'].get('market_focus', '⚠️ No assessment')}")
        print(f"  {self.validation_results['brazilian_compliance'].get('lgpd', '⚠️ No assessment')}")
        print(f"  {self.validation_results['brazilian_compliance'].get('portuguese', '⚠️ No assessment')}")
        
        # Performance results
        print(f"\n⚡ Performance Optimization:")
        print(f"  {self.validation_results['performance'].get('optimization', '⚠️ No assessment')}")
        if self.validation_results['performance'].get('voice'):
            print(f"  {self.validation_results['performance']['voice']}")
        
        # Security results
        print(f"\n🔒 Security Compliance:")
        print(f"  {self.validation_results['security'].get('patterns', '⚠️ No assessment')}")
        print(f"  {self.validation_results['security'].get('sensitive_data', '⚠️ No assessment')}")
        
        print(f"\n🎯 Recommendations:")
        recommendations = self.generate_recommendations()
        for rec in recommendations:
            print(f"  💡 {rec}")

    def generate_recommendations(self) -> list:
        """Generate improvement recommendations"""
        recommendations = []
        
        if 'missing_recommended' in self.validation_results['frontmatter']:
            recommendations.append("Add recommended metadata fields (version, author, category)")
        
        if 'too_long' in self.validation_results['structure']:
            recommendations.append("Move detailed content to references/ directory for better performance")
        
        if self.validation_results['brazilian_compliance'].get('lgpd') == 'Consider adding LGPD compliance information':
            recommendations.append("Add LGPD compliance patterns for Brazilian market applications")
        
        if self.validation_results['performance'].get('optimization') == 'Consider adding performance optimization patterns':
            recommendations.append("Include performance optimization patterns and benchmarks")
        
        if self.validation_results['security'].get('patterns') == 'Consider adding security patterns':
            recommendations.append("Add security patterns and best practices for financial applications")
        
        return recommendations

def main():
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python enhanced_skill_validator.py <skill_directory>")
        sys.exit(1)
    
    validator = EnhancedSkillValidator()
    results = validator.validate_skill(sys.argv[1])
    
    if 'error' in results:
        print(f"❌ Validation error: {results['error']}")
        sys.exit(1)
    
    validator.print_report()
    
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
