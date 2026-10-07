import type {RunView} from './run-contract';
// Open questions: README.md#open-questions.
export const labels:Record<RunView['execution'],string>={
 preparing:'Preparing',queued:'Queued',running:'Running',blocked:'Blocked',succeeded:'Succeeded',failed:'Failed',cancelling:'Cancelling',cancelled:'Cancelled',uncertain:'Uncertain',unknown:'Unknown',
};
export function WorkIcon({kind}:{kind:RunView['icon']}) {return <svg className="dashboard-work-icon" role="img" aria-label={kind==='text-task'?'Text task':kind==='research'?'Research':'Workflow'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={kind==='text-task'?'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h4':kind==='research'?'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM15 15l6 6':'M4 4h5v5H4zM15 15h5v5h-5zM6 9v8h9'}/></svg>;}
