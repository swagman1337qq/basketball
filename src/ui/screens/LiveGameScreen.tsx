import { LiveGame } from '../live/LiveGame';
import type { VM } from '../vm';

export function LiveGameScreen({ vm }: { vm: VM }) {
  return (
    <>
      <LiveGame logos={vm.live.logos} home={vm.live.home} away={vm.live.away} userSide={vm.live.userSide} onFinish={vm.live.onFinish} onPlayer={vm.live.onPlayer} norms={vm.live.norms} onTeam={vm.live.onTeam} />
    </>
  );
}
