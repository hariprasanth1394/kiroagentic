# Allure Report Generation

## Source Priority

1. **HyperExecute artifacts:** `automation/artifacts/Allure Results/{taskId}/allure-results/`
2. **Local run results:** `automation/allure-results/` (from local playwright run)
3. **Playwright HTML report:** `automation/test-results/` (fallback if no allure)

## Procedure

### Check for artifacts

```powershell
cd qe-pipeline/output/{KEY}/automation

# Check HyperExecute artifacts first
$hePaths = Get-ChildItem -Recurse -Path "artifacts" -Filter "*-result.json" -ErrorAction SilentlyContinue

# Check local allure-results
$localPaths = Get-ChildItem -Path "allure-results" -Filter "*-result.json" -ErrorAction SilentlyContinue
```

### If HyperExecute artifacts exist

Merge from all task subfolders:
```powershell
New-Item -ItemType Directory -Path "merged-allure-results" -Force
Get-ChildItem -Recurse -Path "artifacts" -Directory -Filter "allure-results" | ForEach-Object {
  Copy-Item "$($_.FullName)\*" "merged-allure-results" -Force
}
npx allure generate merged-allure-results --clean --single-file -o ../reporter/allure-report
```

### If only local allure-results exist

```powershell
npx allure generate allure-results --clean --single-file -o ../reporter/allure-report
```

### If no allure-results at all

- Check if `test-results/` exists (Playwright's default output with screenshots/videos)
- If yes: generate a minimal report from those
- If nothing: skip report generation, set `allureReport: null` in quality_gate.json

**Do NOT block the entire pipeline** just because Allure report can't be generated. The quality gate evaluation and JIRA posting should still proceed.

### Verify

```powershell
Test-Path "qe-pipeline/output/{KEY}/reporter/allure-report/index.html"
```

### npx allure note

First run downloads ~30MB Allure CLI. Cached after that. If download fails (network), proceed without report.
