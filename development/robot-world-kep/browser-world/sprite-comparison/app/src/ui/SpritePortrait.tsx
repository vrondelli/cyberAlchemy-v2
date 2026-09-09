import type { RobotId } from '../world/types';

export function SpritePortrait({ id }: { readonly id: RobotId }) {
  return <span className={`sprite-portrait ${id}`} aria-hidden="true"><span className="sprite-portrait-art" /></span>;
}
