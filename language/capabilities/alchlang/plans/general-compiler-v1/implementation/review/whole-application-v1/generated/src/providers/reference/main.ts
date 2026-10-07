import {runReferenceApplication} from "./entrypoint.js";runReferenceApplication(process.env).catch(error=>{console.error(error);process.exitCode=1;});
