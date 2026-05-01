python3 -c "
content = open('/Users/sophiaduncan/Documents/trae_projects/f1/src/components/dashboard-nav.tsx').read()
lines = content.split('\n')
seen = False
new_lines = []
for line in lines:
    if line.strip() == '\"use client\";':
        if not seen:
            new_lines.append(line)
            seen = True
    else:
        new_lines.append(line)
open('/Users/sophiaduncan/Documents/trae_projects/f1/src/components/dashboard-nav.tsx', 'w').write('\n'.join(new_lines))
print('done')
"