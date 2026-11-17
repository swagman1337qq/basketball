import { statsReader } from './profileStatsContext';
import { computeProfileSeason } from './profileStatsData';
import type { Game } from '../engine/Game';
import type { StatsRequest, StatsReply } from './profileStatsProtocol';
const scope = self as unknown as { onmessage: (event: MessageEvent<StatsRequest>) => void; postMessage: (reply: StatsReply) => void };
let reader: Game | undefined;
let epoch = '';
scope.onmessage = ({ data: job }) => {
  const tag = { id: job.id, epoch: job.epoch, pid: job.pid, po: job.po, ccp: job.ccp };
  try {
    if (job.context) {
      reader = statsReader(job.context);
      epoch = job.epoch;
    }
    if (!reader || epoch !== job.epoch) throw Error('Statistics context is no longer current.');
    for (const year of job.years) {
      const value = computeProfileSeason(reader, reader.state, job.pid, year, job.po, job.ccp);
      scope.postMessage({ ...tag, type: 'season', year, value });
    }
    scope.postMessage({ ...tag, type: 'done' });
  } catch (error) {
    scope.postMessage({ ...tag, type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};
