#!/usr/bin/env python3
import sys, os, re, glob

GREEN = '[92m'
YELLOW = '[93m'
RED = '[91m'
RESET = '[0m'

OUTBOUND_PATTERNS = ['fetch(', 'axios', 'http.get', 'http.post', 'requests.get', 'requests.post', 'curl', 'wget', 'remote:', 'baseUrl:']
SHELL_INJECTION_PATTERNS = ['eval(', 'exec(', 'os.system(', '__import__(']
SUBPROCESS_SHELL_PATTERN = r'subprocess\.run\s*\([^)]*shell\s*=\s*True'
PROMPT_INJECTION_PATTERNS = ['ignore your', 'ignore all previous', 'disregard', 'override your', 'forget your instructions', 'bypass safety', 'exfiltrate', 'send to remote']
ALLOWED_GREEK = {'α', 'β', 'γ', 'π'}

def check_outbound_calls(content):
    warnings = []
    for i, line in enumerate(content.split('
'), 1):
        for pattern in OUTBOUND_PATTERNS:
            if pattern.lower() in line.lower():
                warnings.append((i, f'Outbound call: {pattern}'))
    return warnings

def check_shell_injection(content):
    failures = []
    for i, line in enumerate(content.split('
'), 1):
        for pattern in SHELL_INJECTION_PATTERNS:
            if pattern in line:
                failures.append((i, f'Shell injection risk: {pattern}'))
        if 'subprocess.run' in line and re.search(SUBPROCESS_SHELL_PATTERN, line):
            failures.append((i, 'Shell injection risk: subprocess.run with shell=True'))
    return failures

def check_prompt_injection(content):
    failures = []
    for i, line in enumerate(content.split('
'), 1):
        line_lower = line.lower()
        for pattern in PROMPT_INJECTION_PATTERNS:
            if pattern in line_lower:
                failures.append((i, f'Prompt injection pattern: {pattern}'))
    return failures

def check_invisible_chars(content):
    failures = []
    for i, line in enumerate(content.split('
'), 1):
        for char in line:
            if char == '​':
                failures.append((i, 'Found zero-width space (U+200B)'))
                break
            if char == '‮':
                failures.append((i, 'Found RTL override character'))
                break
    return failures

def audit_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        return 0, 1, [f'Error reading file: {e}']
    
    warnings, failures = [], []
    warnings.extend(check_outbound_calls(content))
    failures.extend(check_shell_injection(content))
    failures.extend(check_prompt_injection(content))
    failures.extend(check_invisible_chars(content))
    
    issues = []
    for line_no, msg in warnings:
        issues.append(f'⚠️  Line {line_no}: {msg}')
    for line_no, msg in failures:
        issues.append(f'❌ Line {line_no}: {msg}')
    
    return len(warnings), len(failures), issues

def format_output(filepath, warnings, failures, issues):
    rel_path = filepath
    try:
        rel_path = os.path.relpath(filepath)
    except:
        pass
    
    if failures > 0:
        output = f'{RED}❌ FAIL{RESET}: {rel_path} — {failures} failures'
    elif warnings > 0:
        output = f'{YELLOW}⚠️  WARN{RESET}: {rel_path} — {warnings} warnings'
    else:
        output = f'{GREEN}✅ PASS{RESET}: {rel_path}'
    
    if issues:
        for issue in issues:
            output += f'
   {issue}'
    return output

def main():
