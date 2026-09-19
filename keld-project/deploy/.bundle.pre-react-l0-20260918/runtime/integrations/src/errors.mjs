export class Rejected extends Error {
  constructor(code,status=400) {super(code);this.code=code;this.status=status;}
}
export class Unavailable extends Rejected {
  constructor(code='service-unavailable') {super(code,503);}
}
export class CreationFailed extends Unavailable {
  constructor(definite=false) {super(definite?'payment-creation-failed':'payment-outcome-uncertain');this.definite=definite;}
}

// Only explicit HTTP request rejection is proof of no creation. Timeouts,
// conflicts, throttling, server errors and malformed success responses are not.
export async function createAtProvider(work) {
  try {return await work();}
  catch(error) {throw new CreationFailed([400,401,403,404,422].includes(error?.statusCode??error?.status));}
}
