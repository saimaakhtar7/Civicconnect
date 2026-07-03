const fs = require('fs');
const path = require('path');
const root = path.resolve('.');
const dirs = ['src/services', 'src/services/ai', 'src/ai', 'src/config', 'src/types', 'src/utils'];
const re = /import\s+(?:[^;]+?)\s+from\s+['\"]([^'\"]+)['\"]|require\(['\"]([^'\"]+)['\"]\)/g;
const errors = [];
const isRelative = (p) => p.startsWith('.') || p.startsWith('./') || p.startsWith('../');
const exists = (p) => fs.existsSync(p);
for (const d of dirs) {
  const dir = path.join(root, d);
  if (!exists(dir)) {
    errors.push(`Missing target dir: ${d}`);
    continue;
  }
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(p);
      } else if (ent.isFile() && p.endsWith('.ts')) {
        const txt = fs.readFileSync(p, 'utf8');
        let m;
        while ((m = re.exec(txt)) !== null) {
          const rel = m[1] || m[2];
          if (!rel || !isRelative(rel)) continue;
          const resolved = path.resolve(path.dirname(p), rel);
          const candidates = [
            resolved,
            resolved + '.ts',
            resolved + '.tsx',
            resolved + '.js',
            resolved + '.jsx',
            path.join(resolved, 'index.ts'),
            path.join(resolved, 'index.tsx'),
            path.join(resolved, 'index.js'),
            path.join(resolved, 'index.jsx'),
          ];
          if (!candidates.some(exists)) {
            errors.push(`${path.relative(root, p)} imports missing ${rel}`);
          }
        }
      }
    }
  };
  walk(dir);
}
if (errors.length) {
  console.log(errors.join('\n'));
  process.exit(1);
} else {
  console.log('No broken relative frontend imports found.');
}
