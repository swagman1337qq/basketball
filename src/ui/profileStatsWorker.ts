import { statsReader } from './profileStatsContext';
import { computeProfileSeason } from './profileStatsData';
import { ProfileHistoryCache } from './profileHistoryCache';
import type { Game } from '../engine/Game';
import type { StatsCommand, StatsContext, StatsReply } from './profileStatsProtocol';
const scope = self as unknown as { onmessage: (event: MessageEvent<StatsCommand>) => void; postMessage: (reply: StatsReply) => void };
let reader: Game | undefined;
let context: StatsContext | undefined;
let epoch = '';
const history = new ProfileHistoryCache();
scope.onmessage = ({ data: job }) => {
  if ('type' in job) {
    reader = undefined;
    context = undefined;
    epoch = '';
    history.releaseContext();
    return;
  }
  const tag = { id: job.id, epoch: job.epoch, pid: job.pid, po: job.po, ccp: job.ccp };
  try {
    if (job.context) {
      history.releaseContext();
      context = job.context;
      reader = statsReader(job.context);
      epoch = job.epoch;
    }
    if (!reader || !context || epoch !== job.epoch) throw Error('Statistics context is no longer current.');
    if (job.years.some(year => year < reader!.Y)) history.prepare(context);
    for (const year of job.years) {
      const cached = history.get(job.pid, year, job.po, job.ccp);
      const value = cached || computeProfileSeason(reader, reader.state, job.pid, year, job.po, job.ccp);
      if (!cached) history.remember(job.pid, year, job.po, job.ccp, value);
      scope.postMessage({ ...tag, type: 'season', year, value, cached: !!cached });
    }
    scope.postMessage({ ...tag, type: 'done' });
  } catch (error) {
    scope.postMessage({ ...tag, type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};
