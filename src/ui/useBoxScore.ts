import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../engine/Game';
import { boxMatchesSummary, isBoxReference } from '../db/boxArchive';
import { boxDetailLoader } from '../db/boxDetails';

export function useBoxScore(g: Game, saveId: string, bid: string) {
  const db = g.db,
    boxes = db.boxes,
    source = boxes?.[bid];
  const selection = useMemo(() => ({ db, boxes, source, saveId, bid }), [db, boxes, source, saveId, bid]);
  const current = useRef(selection);
  current.current = selection;
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ selection: typeof selection | null; box?: any; error?: string }>(() =>
    !isBoxReference(source) ? { selection, box: source } : { selection: null },
  );
  const retained =
    loaded.selection?.db === db &&
    loaded.selection?.boxes === boxes &&
    loaded.selection?.bid === bid &&
    loaded.selection?.saveId === saveId &&
    boxMatchesSummary(loaded.box, source, saveId, bid)
      ? loaded.box
      : undefined;
  useEffect(() => {
    if (!isBoxReference(source)) {
      if (loaded.selection !== selection) setLoaded({ selection, box: source });
      return;
    }
    // Saving can replace the live full object with its committed summary. Keep
    // the currently viewed details when the immutable version still matches.
    if (retained) {
      if (loaded.selection !== selection) setLoaded({ selection, box: retained });
      return;
    }
    const controller = new AbortController();
    const isCurrent = () =>
      current.current === selection && g.db === db && g.db.boxes === boxes && boxes[bid] === source && g.state.boxId === bid;
    void boxDetailLoader
      .load(g, saveId, bid, { signal: controller.signal, isCurrent })
      .then(box => {
        if (!controller.signal.aborted && isCurrent()) setLoaded({ selection, box });
      })
      .catch(error => {
        if (controller.signal.aborted || !isCurrent() || error?.name === 'AbortError') return;
        setLoaded({
          selection,
          error: String(error?.message).includes('no longer match')
            ? 'This saved game changed in another session. Reload the league to view its current details.'
            : 'Game details could not be loaded. Your saved data has not been changed.',
        });
      });
    return () => controller.abort();
  }, [g, selection, retry]);
  const matching = loaded.selection === selection;
  const error = matching ? loaded.error : undefined;
  const box = !isBoxReference(source) ? source : matching && loaded.box ? loaded.box : retained || source;
  return {
    box,
    loading: isBoxReference(box) && !error,
    error,
    retry: () => {
      setLoaded({ selection: null });
      setRetry(n => n + 1);
    },
  };
}
