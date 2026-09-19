import {memo} from 'react';
import {Handle,Position,type NodeProps,type Node} from '@xyflow/react';
import {type FeaturePart} from './featureMaps';
import {canvasHref} from './documentationContent';

export type PartNode=Node<{part:FeaturePart},'featurePart'>;
export const Part=memo(({data}:NodeProps<PartNode>)=><section className="feature-part">
 {[Position.Left,Position.Right,Position.Top,Position.Bottom].map(position=><Handle key={'in-'+position} id={'in-'+position} type="target" position={position}/>)}{[Position.Left,Position.Right,Position.Top,Position.Bottom].map(position=><Handle key={'out-'+position} id={'out-'+position} type="source" position={position}/>)}
 <h2>{data.part.title}</h2><p>{data.part.detail}</p>
 {data.part.related&&<a className="nodrag nopan" href={canvasHref(data.part.related)}>Explore related feature →</a>}
</section>);
