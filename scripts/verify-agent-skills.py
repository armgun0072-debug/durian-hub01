"""Read-only integrity and local Markdown-link check for project-installed skills."""

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'skills-lock.json').read_text(encoding='utf-8'))
assert manifest['schema'] == 'durian-hub-agent-skills/v1', 'Unsupported manifest schema'
names = set()
for path in (root / '.agents/skills').glob('*/SKILL.md'):
    text = path.read_text(encoding='utf-8-sig')
    assert text.startswith('---\n'), f'Missing frontmatter: {path}'
    header = text.split('---', 2)[1]
    match = re.search(r'^name:\s*(.+)$', header, re.M)
    assert match and re.search(r'^description:\s*.+', header, re.M), f'Invalid metadata: {path}'
    name = match[1].strip().strip('"\'')
    assert name not in names, f'Duplicate skill name: {name}'
    names.add(name)

total = 0
for name, entry in manifest['skills'].items():
    folder = (root / entry['destination']).resolve()
    assert folder.is_relative_to(root / '.agents/skills'), f'Invalid destination: {name}'
    assert (folder / 'SKILL.md').is_file() and (folder / 'LICENSE').is_file(), f'Incomplete skill: {name}'
    actual = {
        path.relative_to(folder).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(folder.rglob('*')) if path.is_file()
    }
    assert actual == entry['sha256'], f'File inventory or hash mismatch: {name}'
    total += len(actual)
    for path in folder.rglob('*.md'):
        text = re.sub(r'```[^\n]*\n.*?```', '', path.read_text(encoding='utf-8'), flags=re.S)
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)', text):
            target = unquote(target.split('#', 1)[0])
            if not target or '://' in target or target.startswith(('mailto:', '/')):
                continue
            assert (path.parent / target).exists(), f'Missing link: {path} -> {target}'

print(f'PASS: {len(manifest["skills"])} managed skills, {len(names)} unique names, {total} SHA-256 hashes; metadata, licenses and local Markdown links checked.')
