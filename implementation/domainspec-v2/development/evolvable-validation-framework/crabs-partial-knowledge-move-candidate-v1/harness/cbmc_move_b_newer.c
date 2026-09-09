#include "cbmc_partial_knowledge.h"

int main(void) {
  bool result = evf_cbmc_representative(true);
  __CPROVER_assert(result, "EVF_CBMC_B_NEWER_CONVERGENCE");
  return 0;
}
