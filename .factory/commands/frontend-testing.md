# Command: /frontend-testing | /testar-frontend

## Universal Description

**COMPREHENSIVE FRONTEND TESTING ORCHESTRATION** - Multi-droid parallel execution with Docker MCP Gateway integration, delivering complete frontend quality validation through coordinated testing tools (Vitest, Playwright, Biome), browser automation, and Brazilian accessibility compliance (WCAG 2.1 AA+ / NBR 17225).

## Purpose

Execute comprehensive frontend testing operations through Docker MCP Gateway orchestration with atomic task generation, parallel execution capabilities, and integrated MCP stack (serena, context7, playwright, tavily, sequential-thinking) for authoritative multi-source validation and actionable quality intelligence with Brazilian LGPD/accessibility compliance for education/health sectors.

## Testing Stack & Tools

```yaml
unit_integration_testing:
  vitest:
    version: "4.x"
    features:
      - browser_mode: "Real browser testing with Playwright provider"
      - coverage: "@vitest/coverage-v8 for accurate coverage"
      - watch_mode: "Instant feedback during development"
      - fixtures: "Custom test fixtures for reusable setup"
    configuration:
      environment: "jsdom for DOM testing"
      globals: true
      pool: "forks for isolated test execution"

e2e_visual_testing:
  playwright:
    version: "1.51+"
    features:
      - e2e_testing: "Full browser automation testing"
      - visual_regression: "Screenshot comparison testing"
      - accessibility: "axe-core/playwright WCAG validation"
      - component_testing: "Isolated component testing"
    configuration:
      browsers: ["chromium", "firefox", "webkit"]
      trace: "on-first-retry for debugging"

code_quality:
  biome:
    version: "2.3.x"
    features:
      - linting: "Fast, Rust-based linting"
      - formatting: "Consistent code style"
      - a11y_rules: "Accessibility linting (28+ rules)"
      - security_rules: "Security vulnerability detection"
```

## Docker MCP Gateway Integration

### Available MCP Stack
```yaml
mcp_stack:
  serena: "Codebase intelligence & test file discovery"
  context7: "Official testing library documentation"
  playwright_mcp: "Browser automation via MCP protocol"
  tavily: "Testing best practices & community patterns"
  sequential_thinking: "Complex test scenario planning"
```

### MCP Tool Chains

```yaml
test_analysis_chain:
  - serena.find_symbol: "Discover test files and test suites"
  - serena.get_symbols_overview: "Understand test structure"
  - serena.search_for_pattern: "Find testing patterns"

documentation_chain:
  - context7.resolve-library-id: "Find testing lib docs"
  - context7.get-library-docs: "Fetch official documentation"

browser_testing_chain:
  - playwright_mcp.browser_navigate: "Navigate to test page"
  - playwright_mcp.browser_snapshot: "Capture accessibility tree"
  - playwright_mcp.browser_take_screenshot: "Visual regression capture"

research_chain:
  - tavily-search: "Best practices research"
  - sequential_thinking: "Complex test scenario analysis"
```

## Droid Orchestration

### code-reviewer Integration

```yaml
code_reviewer:
  activation_triggers:
    - security_validation
    - owasp_compliance
    - lgpd_data_protection
    - test_coverage_validation
  
  validation_checklist:
    security:
      - injection_prevention: "SQL, NoSQL, XSS"
      - authentication_tests: "Auth flow validation"
      - sensitive_data: "Encryption verification"
      - dependency_vulnerabilities: "Package security"
    
    compliance:
      - lgpd_data_protection: "Student/user data handling"
      - test_coverage_thresholds: "≥90% for critical paths"
      - audit_logging: "Compliance event tracking"
    
  output:
    - security_findings: "Critical/High/Medium/Low"
    - compliance_status: "LGPD compliant/issues"
    - recommendations: "Priority fixes"
```

### apex-ui-ux-designer Integration

```yaml
apex_ui_ux_designer:
  activation_triggers:
    - accessibility_testing
    - wcag_validation
    - visual_regression
    - ui_component_testing
  
  validation_checklist:
    accessibility:
      - wcag_2_1_aa: "All Level A and AA criteria"
      - nbr_17225: "Brazilian accessibility standard"
      - keyboard_navigation: "Complete tab order"
      - screen_reader: "ARIA labels in Portuguese"
      - color_contrast: "4.5:1 normal, 3:1 large text"
      - motion_preference: "prefers-reduced-motion respect"
    
    visual:
      - responsive_layout: "Mobile-first validation"
      - touch_targets: "44px minimum"
      - design_consistency: "Design token adherence"
      - portuguese_interface: "Labels and messages"
    
  output:
    - wcag_level: "AA/AAA achieved"
    - accessibility_issues: "With severity and fixes"
    - visual_report: "Screenshot comparison"
```

## Antigravity Browser Tools Integration

### browser_subagent Usage

```yaml
browser_subagent:
  use_cases:
    - interactive_testing: "Complex user flow validation"
    - visual_verification: "UI state inspection"
    - accessibility_audit: "Live DOM accessibility check"
    - screenshot_capture: "Visual regression baselines"
  
  example_tasks:
    - "Navigate to login page and verify WCAG compliance"
    - "Test form submission flow with validation errors"
    - "Capture screenshots of responsive breakpoints"
    - "Verify keyboard navigation order"
  
  integration:
    recording: "Automatic WebP video recording"
    artifacts: "Screenshots saved to artifacts directory"
```

## Testing Commands

### Unit Testing (Vitest)

```bash
# Run all unit tests
bun test

# Watch mode for development
bun test:watch

# Run tests with UI reporter
bun test:ui

# Run tests with coverage
bun test:coverage

# Run specific test file
bun test src/components/Button.test.tsx

# Run tests matching pattern
bun test --testNamePattern="accessibility"
```

### E2E Testing (Playwright CLI)

```bash
# Install Playwright browsers
bunx playwright install

# Run all E2E tests
bunx playwright test

# Run with UI mode (interactive debugging)
bunx playwright test --ui

# Run specific test file
bunx playwright test tests/e2e/login.spec.ts

# Run with trace on failure
bunx playwright test --trace on-first-retry

# Generate test report
bunx playwright show-report

# Run accessibility tests only
bunx playwright test --grep="accessibility"
```

### Visual Regression Testing

```bash
# Update visual snapshots
bunx playwright test --update-snapshots

# Run visual comparison tests
bunx playwright test tests/visual/

# Generate visual diff report
bunx playwright test --reporter=html
```

### Accessibility Testing (axe-core + Playwright)

```typescript
// Example: tests/a11y/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard Accessibility', () => {
  test('should pass WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityResults.violations).toEqual([]);
  });
  
  test('should have no critical issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results = await new AxeBuilder({ page })
      .options({ resultTypes: ['violations'] })
      .analyze();
    
    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(critical).toHaveLength(0);
  });
});
```

### Code Quality (Biome)

```bash
# Run linting check
bun lint:check

# Run linting with auto-fix
bun lint

# Check formatting only
bun format:check

# Format all files
bun format

# Run complete quality check
bun lint:check && bun format:check
```

## Command Execution Protocol

### Complexity Matrix

```yaml
L1-L3_simple:
  description: "Single component/file testing"
  duration: "5-15 min"
  tests:
    - vitest: "Unit tests only"
    - biome: "Lint check"
  droids: []
  mcps: ["serena"]

L4-L6_moderate:
  description: "Feature/page testing"
  duration: "15-45 min"
  tests:
    - vitest: "Unit + integration"
    - playwright: "Basic E2E"
    - biome: "Full quality check"
  droids: ["code-reviewer"]
  mcps: ["serena", "context7"]

L7-L8_complex:
  description: "Full flow testing with accessibility"
  duration: "45-120 min"
  tests:
    - vitest: "Full suite with coverage"
    - playwright: "E2E + visual + accessibility"
    - biome: "Full quality + security"
  droids: ["code-reviewer", "apex-ui-ux-designer"]
  mcps: ["serena", "context7", "playwright", "tavily"]

L9-L10_mission_critical:
  description: "Complete quality validation"
  duration: "2-4 hours"
  tests:
    - vitest: "Full coverage (≥90%)"
    - playwright: "Cross-browser + visual + a11y"
    - biome: "Full quality + security + a11y rules"
    - browser_subagent: "Manual flow verification"
  droids: ["code-reviewer", "apex-ui-ux-designer"]
  mcps: ["serena", "context7", "playwright", "tavily", "sequential-thinking"]
```

### Automatic Skill Activation

```yaml
skill_triggers:
  webapp-testing:
    keywords: ["test", "testing", "vitest", "playwright"]
    agents: ["apex-dev", "code-reviewer"]
    mcps: ["serena", "playwright"]
  
  frontend-design:
    keywords: ["visual", "ui", "component", "accessibility"]
    agents: ["apex-ui-ux-designer"]
    mcps: ["serena", "context7", "playwright"]
  
  education-lgpd-compliance:
    keywords: ["LGPD", "student", "aluno", "data protection"]
    agents: ["code-reviewer", "database-specialist"]
    mcps: ["serena", "context7", "neon"]
```

## Execution Phases

### Phase 1: Analysis

```yaml
phase_1_analysis:
  serena:
    - find_symbol: "Locate test files and test utilities"
    - get_symbols_overview: "Understand test structure"
    - search_for_pattern: "Find test patterns and coverage gaps"
  
  context7:
    - resolve-library-id: "vitest, playwright, @testing-library/react"
    - get-library-docs: "Fetch relevant testing documentation"
  
  output: "Test scope analysis + coverage gap identification"
```

### Phase 2: Execution

```yaml
phase_2_execution:
  vitest:
    commands:
      - "bun test --run"
      - "bun test:coverage"
    validation: "All tests pass + coverage thresholds met"
  
  playwright:
    commands:
      - "bunx playwright test"
      - "bunx playwright test tests/a11y/"
    validation: "E2E pass + accessibility clean"
  
  biome:
    commands:
      - "bun lint:check"
      - "bun format:check"
    validation: "No linting errors + consistent formatting"
  
  browser_subagent:
    tasks:
      - "Visual verification of critical flows"
      - "Screenshot capture for documentation"
    validation: "UI renders correctly + interactions work"
```

### Phase 3: Validation

```yaml
phase_3_validation:
  code_reviewer:
    scope:
      - security_validation: "OWASP Top 10 patterns in tests"
      - coverage_analysis: "≥90% for critical paths"
      - lgpd_compliance: "Data handling in tests"
    output: "Security assessment report"
  
  apex_ui_ux_designer:
    scope:
      - wcag_validation: "WCAG 2.1 AA compliance"
      - visual_consistency: "Design token adherence"
      - portuguese_validation: "Interface labels"
    output: "Accessibility audit report"
  
  synthesis:
    - "Combine all validation results"
    - "Generate actionable recommendations"
    - "Update test documentation"
```

## Quality Gates

### Coverage Thresholds

```yaml
coverage_targets:
  global:
    lines: 80
    branches: 80
    functions: 80
    statements: 80
  
  critical_paths:
    auth: 95
    payments: 95
    lgpd_compliance: 95
    security: 95
  
  ui_components:
    components: 85
    hooks: 90
    utilities: 90
```

### Accessibility Standards

```yaml
accessibility:
  wcag:
    level: "AA (AAA for critical flows)"
    version: "2.1"
    automated: "axe-core validation"
    manual: "apex-ui-ux-designer review"
  
  brazilian:
    nbr_17225: "Digital accessibility compliance"
    portuguese: "All labels and messages"
    
  validation:
    color_contrast: "4.5:1 normal, 3:1 large"
    touch_targets: "44px minimum"
    keyboard_nav: "Complete without mouse"
    screen_reader: "Full ARIA support"
```

## Quick Reference

### Command Triggers

```yaml
triggers:
  - "/frontend-testing"
  - "/testar-frontend"
  - "/test"
  - "/qa"
  - "/quality"
```

### Example Usage

```markdown
/frontend-testing "validate login flow accessibility"

→ Execution:
- serena: Find login components and tests
- playwright: Run E2E login tests
- axe-core: WCAG 2.1 AA validation
- apex-ui-ux-designer: Accessibility review
- Output: Test report + accessibility audit
```

```markdown
/frontend-testing "complete quality validation for dashboard"

→ Execution:
- vitest: Full unit/integration test suite
- playwright: E2E + visual regression + accessibility
- biome: Code quality + security linting
- code-reviewer: Security + LGPD compliance
- apex-ui-ux-designer: UI/UX + WCAG audit
- browser_subagent: Visual verification
- Output: Comprehensive quality report
```

## Configuration Files Reference

### vitest.config.ts (via vite.config.ts)

```typescript
// Current project configuration
test: {
  globals: true,
  environment: 'jsdom',
  include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
  exclude: ['node_modules', 'dist', '.output'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      lines: 80,
      branches: 80,
      functions: 80
    }
  }
}
```

### playwright.config.ts (recommended)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'bun dev:web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### biome.json (already configured)

```yaml
# Key testing-related settings:
linter:
  domains:
    test: "recommended"
  rules:
    suspicious:
      noFocusedTests: "error"  # Prevent .only in commits
      noSkippedTests: "warn"   # Flag .skip tests
      noExportsInTest: "error" # Keep tests isolated
    a11y:
      # 28+ accessibility rules enabled
      useAltText: "error"
      useButtonType: "error"
      # ... (full list in biome.json)
```

---

> **🎯 Unified Testing Command**: This command orchestrates all frontend testing tools, MCPs, and droids to deliver comprehensive quality validation with Brazilian compliance built-in.