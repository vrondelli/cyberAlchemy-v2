#include "cbmc_partial_knowledge.h"

int main(void) {
  bool result = evf_cbmc_representative(false);
  __CPROVER_assert(result, "EVF_CBMC_C_NEWER_CONVERGENCE");
  return 0;
}
