// Shared admission across comparison arms. Open questions: CURRENT-ARE-ADMISSION.md.
import {createNativeInvestigationDriver as createBaseDriver} from './independent-native-driver.mjs';
import {createPromptAdmission} from './aggregate-prompt-admission.mjs';
export function createNativeInvestigationDriver({persist,...native}){
 const admit=createPromptAdmission({client:native.client,persist,signal:native.signal});
 const driver=createBaseDriver(native);let closed=false;
 return Object.freeze({...driver,measurePrompt:prompt=>native.client.measureEnvelope(prompt),admitMessages(messages,tools){if(closed)throw Error('aggregate-native.closed');return admit(messages,tools);},close(){closed=true;return driver.close();}});
}
