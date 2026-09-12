#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "OT/ot_ordered_set.h"
#include "OT/ot_transform.h"
#include "OT/position_map.h"

#ifdef __CPROVER__
void *__CPROVER_allocate(size_t size, bool zero);

void *get_memory(size_t size) { return __CPROVER_allocate(size, false); }
void *get_clear_memory(size_t size) { return __CPROVER_allocate(size, true); }
#else
static void require_allocation(void *value) { assert(value != NULL); }

void *get_memory(size_t size) {
  void *value = malloc(size);
  require_allocation(value);
  return value;
}

void *get_clear_memory(size_t size) {
  void *value = calloc(1, size);
  require_allocation(value);
  return value;
}
#endif

bool crabs_ot_op_id_equal(const crabs_ot_op_id_t *a,
                          const crabs_ot_op_id_t *b) {
  if (a == NULL || b == NULL) return a == b;
  return a->sequence_num == b->sequence_num &&
         a->timestamp == b->timestamp &&
         memcmp(a->node_id, b->node_id, CRABS_MAX_USER_ID) == 0;
}

crabs_bst_node_t *crabs_bst_merge(crabs_bst_node_t *dest,
                                  const crabs_bst_node_t *src) {
  (void)src;
  return dest;
}

crabs_ot_data_item_t *crabs_ot_data_item_create(uint32_t type) {
  (void)type;
  return NULL;
}

void crabs_ot_data_item_destroy(crabs_ot_data_item_t *item) { (void)item; }
void crabs_transform_matrix_init(crabs_ot_data_item_t *item) { (void)item; }

uint64_t crabs_xi_inv(const crabs_bst_node_t *tree, uint64_t position) {
  (void)tree;
  return position;
}

crabs_bst_node_t *crabs_union_one(crabs_bst_node_t *root, uint64_t position) {
  (void)position;
  return root;
}

crabs_bst_node_t *crabs_xi_one(crabs_bst_node_t *root, uint64_t position) {
  (void)position;
  return root;
}
