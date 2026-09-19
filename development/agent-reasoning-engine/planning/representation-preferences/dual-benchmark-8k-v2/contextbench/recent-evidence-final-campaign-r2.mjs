// R2 campaign selects the corrected native ranked-context donor.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {qualifyRecentEvidenceFinalCampaign} from './recent-evidence-final-campaign-r1.mjs';
import {loadRecentFinalDonorR2} from './recent-evidence-final-donor-r2.mjs';

export function qualifyRecentEvidenceFinalCampaignR2(request, dependencies = {}) {
  return qualifyRecentEvidenceFinalCampaign(request,
    {...dependencies, load: dependencies.load ?? loadRecentFinalDonorR2});
}
