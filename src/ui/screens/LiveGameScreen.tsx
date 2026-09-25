import { LiveGame } from '../live/LiveGame';
import type { VM } from '../vm';

export function LiveGameScreen({ vm }: { vm: VM }) {
  return (
    <>
      <LiveGame home={vm.live.home} away={vm.live.away} userSide={vm.live.userSide} onFinish={vm.live.onFinish} onPlayer={vm.live.onPlayer} tactics={vm.live.tactics} onTeam={vm.live.onTeam} />
    </>
  );
}
