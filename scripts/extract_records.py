# -*- coding: utf-8 -*-
import json

with open('scripts/audit_last_run.json', encoding='utf-8') as f:
    content = f.read()

marker = '--- JSON ---'
idx = content.find(marker)
json_str = content[idx + len(marker):].strip()

depth = 0
end_idx = 0
for i, c in enumerate(json_str):
    if c == '{':
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0:
            end_idx = i + 1
            break
json_str = json_str[:end_idx]

data = json.loads(json_str)
records = data.get('facts', {}).get('mdx_records', [])

page_slugs = [
    'concept-hope-sorting', 'concept-path-judgment', 'faq-japanese-path',
    'faq-job-prep', 'faq-partner-collaboration', 'faq-resume-or-japanese-first',
    'what-we-dont-handle-yet', 'when-to-use-hope-sorting'
]

# Print all records for debugging
for r in records:
    if r.get('slug') in page_slugs and r.get('locale') == 'zh':
        line = "slug=%s|contentType=%s|category=%s|hasTldr=%s|hasConclusionH2=%s|hasSuitableFor=%s|hasNotSuitableFor=%s|hasNextSteps=%s" % (
            r.get('slug', ''),
            r.get('contentType', ''),
            r.get('category', ''),
            r.get('hasTldr'),
            r.get('hasConclusionH2'),
            r.get('hasSuitableFor'),
            r.get('hasNotSuitableFor'),
            r.get('hasNextSteps'),
        )
        print(line)
print('---TOTAL---')
print('done, matching records: %d' % len([r for r in records if r.get('slug') in page_slugs and r.get('locale') == 'zh']))