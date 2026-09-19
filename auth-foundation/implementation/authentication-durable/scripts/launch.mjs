import {createCluster} from './cluster.mjs';const cluster=await createCluster();for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await cluster.stop();process.exit(0)});
