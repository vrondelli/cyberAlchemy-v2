"""Conservative matching for published short names versus verbose full names. Open questions: README.md."""
def score(row,statuses):
 passed={t for t,s in statuses.items() if 'pass' in s.lower()}
 failed={t for t,s in statuses.items() if 'fail' in s.lower()}
 ftp=set(row['FAIL_TO_PASS']);ptp=set(row['PASS_TO_PASS']);expected=ftp|ptp
 matches={e:[k for k in statuses if k==e or k.endswith(' > '+e)] for e in expected}
 # Ambiguous suffixes cannot hide failure: every matching full test must pass.
 passed_normalized={e for e,ks in matches.items() if ks and all(statuses[k].lower()=='pass' for k in ks)}
 failed_normalized={e for e,ks in matches.items() if any(statuses[k].lower()=='fail' for k in ks)}
 return {'upstream_resolved':ftp.issubset(passed) and not ((ftp|ptp)&failed),'resolved':expected.issubset(passed_normalized),'strict_all_expected_pass':expected.issubset(passed_normalized),'scoring_protocol':'all-matching-full-test-names-must-pass/v1','fail_to_pass_total':len(ftp),'fail_to_pass_passed':len(ftp&passed_normalized),'pass_to_pass_total':len(ptp),'pass_to_pass_passed':len(ptp&passed_normalized),'missing_expected':sum(not ks for ks in matches.values()),'ambiguous_expected':sum(len(ks)>1 for ks in matches.values()),'failed_expected':len(failed_normalized),'parsed_tests':len(statuses)}
