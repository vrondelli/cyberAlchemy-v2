#ifndef EVF_CBMC_PARTIAL_KNOWLEDGE_H
#define EVF_CBMC_PARTIAL_KNOWLEDGE_H

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include "OT/ot_ordered_set.h"

static void evf_cbmc_id(crabs_ot_op_id_t *id, char node, uint64_t sequence) {
  memset(id, 0, sizeof(*id));
  id->node_id[0] = node;
  id->sequence_num = sequence;
}

static crabs_ot_operation_t evf_cbmc_insert(char node, uint64_t position,
                                            uint8_t *payload) {
  crabs_ot_operation_t operation;
  memset(&operation, 0, sizeof(operation));
  evf_cbmc_id(&operation.id, node, 1);
  operation.op_type = CRABS_OT_OP_INSERT;
  operation.visible_pos = position;
  operation.payload = payload;
  operation.payload_size = 1;
  return operation;
}

static crabs_ot_operation_t evf_cbmc_move(uint64_t sequence) {
  crabs_ot_operation_t operation;
  memset(&operation, 0, sizeof(operation));
  evf_cbmc_id(&operation.id, 'M', sequence);
  operation.op_type = CRABS_OT_OP_MOVE;
  operation.visible_pos = 1;
  operation.visible_pos_2 = 0;
  return operation;
}

static bool evf_cbmc_apply_insert(crabs_ot_ordered_set_t *set, char node,
                                  uint64_t position, uint8_t value) {
  crabs_ot_operation_t operation = evf_cbmc_insert(node, position, &value);
  return crabs_ot_ordered_set_apply_insert(set, &operation) != NULL;
}

static crabs_ot_ordered_set_t *evf_cbmc_build_ab(bool b_newer, bool *ok) {
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  *ok = set != NULL && evf_cbmc_apply_insert(set, 'A', 0, 1) &&
        evf_cbmc_apply_insert(set, 'B', 1, 2);
  if (*ok) {
    crabs_ot_operation_t move = evf_cbmc_move(b_newer ? 2 : 1);
    *ok = crabs_ot_ordered_set_apply_move(set, &move) != NULL;
  }
  return set;
}

static crabs_ot_ordered_set_t *evf_cbmc_build_ac(bool b_newer, bool *ok) {
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  *ok = set != NULL && evf_cbmc_apply_insert(set, 'A', 0, 1) &&
        evf_cbmc_apply_insert(set, 'C', 1, 3);
  if (*ok) {
    crabs_ot_operation_t move = evf_cbmc_move(b_newer ? 1 : 2);
    *ok = crabs_ot_ordered_set_apply_move(set, &move) != NULL;
  }
  return set;
}

static crabs_ot_ordered_set_t *evf_cbmc_build_full(bool *ok) {
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  *ok = set != NULL && evf_cbmc_apply_insert(set, 'A', 0, 1) &&
        evf_cbmc_apply_insert(set, 'B', 1, 2) &&
        evf_cbmc_apply_insert(set, 'C', 1, 3);
  return set;
}

static bool evf_cbmc_same_id(const crabs_ot_op_id_t *left,
                             const crabs_ot_op_id_t *right) {
  return left->sequence_num == right->sequence_num &&
         left->timestamp == right->timestamp &&
         memcmp(left->node_id, right->node_id, CRABS_MAX_USER_ID) == 0;
}

static bool evf_cbmc_valid(const crabs_ot_ordered_set_t *set) {
  if (set == NULL) return false;
  uint32_t count = 0;
  uint32_t visible = 0;
  const crabs_ordered_element_t *previous = NULL;
  for (const crabs_ordered_element_t *element = set->head;
       element != NULL; element = element->next) {
    if (count > set->count || element->prev != previous) return false;
    previous = element;
    count++;
    if (!element->deleted) visible++;
  }
  return previous == set->tail && count == set->count &&
         visible == set->visible_count &&
         set->head != NULL && set->tail != NULL &&
         set->head->prev == NULL && set->tail->next == NULL;
}

static bool evf_cbmc_same_state(const crabs_ot_ordered_set_t *left,
                                const crabs_ot_ordered_set_t *right) {
  if (!evf_cbmc_valid(left) || !evf_cbmc_valid(right) ||
      left->count != right->count ||
      left->visible_count != right->visible_count) return false;
  const crabs_ordered_element_t *a = left->head;
  const crabs_ordered_element_t *b = right->head;
  while (a != NULL && b != NULL) {
    if (!evf_cbmc_same_id(&a->id, &b->id) ||
        a->value_size != b->value_size ||
        a->deleted != b->deleted ||
        a->has_anchor != b->has_anchor ||
        !evf_cbmc_same_id(&a->placement_id, &b->placement_id) ||
        (a->has_anchor && !evf_cbmc_same_id(&a->anchor_id, &b->anchor_id)) ||
        (a->value_size > 0 && memcmp(a->value, b->value, a->value_size) != 0)) {
      return false;
    }
    a = a->next;
    b = b->next;
  }
  return a == NULL && b == NULL;
}

static bool evf_cbmc_expected_order(const crabs_ot_ordered_set_t *set,
                                    const char expected[4]) {
  size_t index = 0;
  for (const crabs_ordered_element_t *element = set->head;
       element != NULL; element = element->next) {
    if (!element->deleted) {
      if (index >= 3 || element->id.node_id[0] != expected[index]) return false;
      index++;
    }
  }
  return index == 3;
}

static bool evf_cbmc_representative(bool b_newer) {
  bool ok0 = false, ok1 = false, ok2 = false;
  bool ok3 = false, ok4 = false, ok5 = false;
  crabs_ot_ordered_set_t *left = evf_cbmc_build_ab(b_newer, &ok0);
  crabs_ot_ordered_set_t *left_ac = evf_cbmc_build_ac(b_newer, &ok1);
  crabs_ot_ordered_set_t *left_full = evf_cbmc_build_full(&ok2);
  crabs_ot_ordered_set_t *right = evf_cbmc_build_ab(b_newer, &ok3);
  crabs_ot_ordered_set_t *right_ac = evf_cbmc_build_ac(b_newer, &ok4);
  crabs_ot_ordered_set_t *right_full = evf_cbmc_build_full(&ok5);
  bool built = ok0 && ok1 && ok2 && ok3 && ok4 && ok5;
  bool merged = built &&
      crabs_ot_ordered_set_merge(left, left_ac) == left &&
      crabs_ot_ordered_set_merge(left, left_full) == left &&
      crabs_ot_ordered_set_merge(right_ac, right_full) == right_ac &&
      crabs_ot_ordered_set_merge(right, right_ac) == right;
  const char *expected = b_newer ? "BAC" : "CAB";
  bool result = merged && evf_cbmc_same_state(left, right) &&
                evf_cbmc_expected_order(left, expected) &&
                evf_cbmc_expected_order(right, expected);
  crabs_ot_ordered_set_destroy(left);
  crabs_ot_ordered_set_destroy(left_ac);
  crabs_ot_ordered_set_destroy(left_full);
  crabs_ot_ordered_set_destroy(right);
  crabs_ot_ordered_set_destroy(right_ac);
  crabs_ot_ordered_set_destroy(right_full);
  return result;
}

#endif
