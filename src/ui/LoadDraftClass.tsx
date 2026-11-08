// God Mode: on the draft board, a shortcut to the draft-class library (screens/DraftClassesScreen.tsx), set to load into
// the class on the board.
import type { Game } from '../engine/Game';
import { GOD_PINK } from './kit';

export function LoadDraftClass({ gm, year, canLoad }: { gm: Game; year: number; canLoad: boolean }) {
  return (
    <button
      className="btn btn-secondary"
      style={{ borderColor: GOD_PINK, color: GOD_PINK, fontSize: '12.5px' }}
      onClick={() => gm.setState({ screen: 'draftClasses', dcYear: canLoad ? year : undefined })}
      title="God Mode: the draft-class library: load a ready-made class or your own into a class that hasn't been drafted"
    >
      Load draft class…
    </button>
  );
}
