// Offline play (2026-10-25): writes sw.js, the service worker (pwa/sw-template.js), with the list of every file
// the built site has (the bundle plus public/) and a version made from their names, so the browser keeps a full
// copy and the game opens and plays with no connection.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pub = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? pub(p) : [p]; });
export function offlinePlugin() {
  return {
    name: 'offline-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['./', './index.html', ...Object.keys(bundle).filter(f => f !== 'index.html').map(f => './' + f),
        ...pub('public').map(p => './' + relative('public', p).split('\\').join('/')).filter(f => !/LICENSE$/i.test(f))];
      const version = createHash('sha1').update(files.join('\n')).digest('hex').slice(0, 12);
      const src = readFileSync('pwa/sw-template.js', 'utf8').replace('self.__VERSION__', JSON.stringify(version)).replace('self.__PRECACHE__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}
