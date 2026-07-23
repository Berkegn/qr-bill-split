import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Basic namespace/using replacements
    replacements = {
        'QrBillSplit.Backend.Models': 'QrBillSplit.Backend.Core.Models',
        'QrBillSplit.Backend.Data': 'QrBillSplit.Backend.Infrastructure.Data',
        'QrBillSplit.Backend.Hubs': 'QrBillSplit.Backend.Services.Hubs',
        'QrBillSplit.Backend.Controllers': 'QrBillSplit.Backend.API.Controllers',
        'QrBillSplit.Backend.Middleware': 'QrBillSplit.Backend.API.Middleware',
        'QrBillSplit.Backend.Migrations': 'QrBillSplit.Backend.Infrastructure.Migrations'
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # Specific namespace overrides based on folder
    if 'Core/DTOs/' in filepath:
        content = content.replace('namespace QrBillSplit.Backend.Core.Models', 'namespace QrBillSplit.Backend.Core.DTOs')
    elif 'Core/Exceptions/' in filepath:
        content = content.replace('namespace QrBillSplit.Backend.Core.Models', 'namespace QrBillSplit.Backend.Core.Exceptions')
    elif 'Core/Interfaces/' in filepath:
        # Interfaces originally belonged to Services, so they might have namespace QrBillSplit.Backend.Services
        content = content.replace('namespace QrBillSplit.Backend.Services', 'namespace QrBillSplit.Backend.Core.Interfaces')

    # Add extra usings if needed
    if 'QrBillSplit.Backend' in content and not filepath.endswith('Program.cs'):
        usings = """
using QrBillSplit.Backend.Core.Interfaces;
using QrBillSplit.Backend.Core.DTOs;
using QrBillSplit.Backend.Core.Exceptions;
"""
        # Find the last using statement to insert after
        match = re.search(r'^(using .*?;(?:\s*using .*?;)*)', content, re.MULTILINE)
        if match:
            # Avoid duplicate usings
            if 'using QrBillSplit.Backend.Core.Interfaces;' not in content:
                content = content[:match.end()] + usings + content[match.end():]

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    if 'obj' in root or 'bin' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.cs'):
            process_file(os.path.join(root, file))
