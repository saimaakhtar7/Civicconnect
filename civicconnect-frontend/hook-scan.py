import re
from pathlib import Path
root = Path('.') / 'src'
regexes = [
    r'if\s*\([^\)]*\)[^\n]*\n\s*use[A-Z][A-Za-z0-9_]*',
    r'\?|[^\n]*use[A-Z][A-Za-z0-9_]*[^\n]*:[^\n]*use[A-Z][A-Za-z0-9_]*',
    r'&&\s*use[A-Z][A-Za-z0-9_]*',
    r'\breturn\s+[^;\n]*use[A-Z][A-Za-z0-9_]*',
    r'\bif\s*\([^\)]*\)[^\n]*\n\s*React\.use[A-Z][A-Za-z0-9_]*'
]
for p in regexes:
    print('PATTERN', p)
    for path in root.rglob('*.ts*'):
        text = path.read_text(encoding='utf-8')
        for m in re.finditer(p, text):
            line = text.count('\n', 0, m.start()) + 1
            print(f'{path}:{line}: {m.group(0)[:200].replace("\n"," | ")}')
