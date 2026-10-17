"""Maintained browser suites; serve dist before running. No production writes."""
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
os.chdir(root)
failures = []
for suite in ('movein-drafts.py', 'movein-service.py', 'partner-types.py', 'crm-identifiers-browser.py', 'crm-workflow-browser.py', 'report-mobile-browser.py'):
    print(f'\nSuite: {suite}', flush=True)
    if subprocess.run([sys.executable, str(root / 'qa' / suite)]).returncode:
        failures.append(suite)
if failures:
    raise SystemExit('Failed: ' + ', '.join(failures))
