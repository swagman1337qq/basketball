import type { Game } from '../engine/Game';
// Browser/tab close cannot guarantee completion of asynchronous IndexedDB work.
// Ask only while real data is unsaved (or a day is running), and expedite its save.
export function protectUnsavedLeave(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>,
  game: Game,
  isSaved: () => boolean,
  flush: () => void,
) {
  const leave = (event: BeforeUnloadEvent) => {
    if (isSaved() && !game.busy) return;
    flush();
    event.preventDefault();
    event.returnValue = '';
  };
  target.addEventListener('beforeunload', leave as EventListener);
  return () => target.removeEventListener('beforeunload', leave as EventListener);
}
