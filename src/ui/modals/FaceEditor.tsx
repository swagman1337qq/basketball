// Illustrated is the live editor. Classic's complete controls remain archived
// in ClassicFaceEditor.tsx and can be restored through engine/portraitMode.ts.
import { useState } from 'react';
import { PORTRAIT_MODE } from '../../engine/portraitMode';
import { readIllustration, setIllustration, type PortraitContext } from '../../engine/illustratedPortraits';
import { newFullPortrait } from '../../engine/fullPortraits';
import { FullFaceEditor } from './FullFaceEditor';
import { ClassicFaceEditor } from './ClassicFaceEditor';
type Props = { gm: any; p: any; onClose: () => void; context?: PortraitContext };
export function FaceEditor(props: Props) {
  return PORTRAIT_MODE.style === 'classic' ? <ClassicFaceEditor {...props} /> : <EditableFaceEditor {...props} />;
}
function EditableFaceEditor({ gm, p, onClose, context = 'player' }: Props) {
  const [original] = useState(() => ({
    faceSeed: p.faceSeed,
    faceX: p.faceX ? structuredClone(p.faceX) : undefined,
    faceImg: p.faceImg,
    race: p.race,
  }));
  const f = gm.face(p.id),
    stored = readIllustration(f.illustration),
    config = stored?.v === 2 ? { ...stored, enabled: true } : newFullPortrait(f, f.seed, context);
  const redraw = () => {
    gm.resetFace(p.id);
    gm.setState((s: any) => ({ gv: (s.gv || 0) + 1 }));
  };
  const cancel = () => {
    (['faceSeed', 'faceX', 'faceImg', 'race'] as const).forEach(k => (original[k] === undefined ? delete p[k] : (p[k] = original[k])));
    redraw();
    onClose();
  };
  return (
    <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: 14 }}>
      <FullFaceEditor
        config={config}
        face={f}
        context={context}
        onChange={value => {
          setIllustration(p, value);
          redraw();
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={cancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIllustration(p, config);
            redraw();
            onClose();
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
