#include <assert.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include "OT/ot_ordered_set.h"

static void id(crabs_ot_op_id_t *out, const char *node, uint64_t sequence) {
  memset(out, 0, sizeof(*out));
  strncpy(out->node_id, node, CRABS_MAX_USER_ID - 1);
  out->sequence_num = sequence;
}

static crabs_ot_operation_t insert_op(const char *node, uint64_t sequence,
                                      uint64_t position, uint8_t *value) {
  crabs_ot_operation_t op;
  memset(&op, 0, sizeof(op));
  id(&op.id, node, sequence);
  op.op_type = CRABS_OT_OP_INSERT;
  op.visible_pos = position;
  op.payload = value;
  op.payload_size = 1;
  return op;
}

static crabs_ot_operation_t move_op(const char *node, uint64_t sequence,
                                    uint64_t from, uint64_t to) {
  crabs_ot_operation_t op;
  memset(&op, 0, sizeof(op));
  id(&op.id, node, sequence);
  op.op_type = CRABS_OT_OP_MOVE;
  op.visible_pos = from;
  op.visible_pos_2 = to;
  return op;
}

static crabs_ot_ordered_set_t *singleton(const char *node, uint8_t value) {
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  crabs_ot_operation_t op = insert_op(node, 1, 0, &value);
  assert(crabs_ot_ordered_set_apply_insert(set, &op) != NULL);
  return set;
}

static crabs_ot_ordered_set_t *sequence3(void) {
  uint8_t a = 1, b = 2, c = 3;
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  crabs_ot_operation_t oa = insert_op("A", 1, 0, &a);
  crabs_ot_operation_t ob = insert_op("B", 1, 1, &b);
  crabs_ot_operation_t oc = insert_op("C", 1, 2, &c);
  assert(crabs_ot_ordered_set_apply_insert(set, &oa) != NULL);
  assert(crabs_ot_ordered_set_apply_insert(set, &ob) != NULL);
  assert(crabs_ot_ordered_set_apply_insert(set, &oc) != NULL);
  return set;
}

static crabs_ot_ordered_set_t *clone_set(const crabs_ot_ordered_set_t *source) {
  crabs_ot_ordered_set_t *copy = crabs_ot_ordered_set_create();
  assert(crabs_ot_ordered_set_merge(copy, source) == copy);
  return copy;
}

static bool same_id(const crabs_ot_op_id_t *a, const crabs_ot_op_id_t *b) {
  return crabs_ot_op_id_equal(a, b);
}

static bool same_state(const crabs_ot_ordered_set_t *a,
                       const crabs_ot_ordered_set_t *b) {
  if (a->count != b->count || a->visible_count != b->visible_count) return false;
  const crabs_ordered_element_t *left = a->head;
  const crabs_ordered_element_t *right = b->head;
  while (left != NULL && right != NULL) {
    if (!same_id(&left->id, &right->id) ||
        left->deleted != right->deleted ||
        left->value_size != right->value_size ||
        left->has_anchor != right->has_anchor ||
        !same_id(&left->placement_id, &right->placement_id) ||
        (left->has_anchor && !same_id(&left->anchor_id, &right->anchor_id)) ||
        (left->value_size > 0 &&
         memcmp(left->value, right->value, left->value_size) != 0)) {
      return false;
    }
    left = left->next;
    right = right->next;
  }
  return left == NULL && right == NULL;
}

static bool valid_links_and_counts(const crabs_ot_ordered_set_t *set) {
  uint32_t count = 0, visible = 0;
  const crabs_ordered_element_t *previous = NULL;
  for (const crabs_ordered_element_t *e = set->head; e != NULL; e = e->next) {
    if (e->prev != previous) return false;
    previous = e;
    count++;
    if (!e->deleted) visible++;
  }
  return previous == set->tail && count == set->count &&
         visible == set->visible_count &&
         ((set->head == NULL && set->tail == NULL) ||
          (set->head->prev == NULL && set->tail->next == NULL));
}

static void test_commutativity(void) {
  crabs_ot_ordered_set_t *a = singleton("A", 1);
  crabs_ot_ordered_set_t *b = singleton("B", 2);
  crabs_ot_ordered_set_t *ab = clone_set(a);
  crabs_ot_ordered_set_t *ba = clone_set(b);
  assert(crabs_ot_ordered_set_merge(ab, b) == ab);
  assert(crabs_ot_ordered_set_merge(ba, a) == ba);
  assert(same_state(ab, ba));
  assert(valid_links_and_counts(ab));
  crabs_ot_ordered_set_destroy(a); crabs_ot_ordered_set_destroy(b);
  crabs_ot_ordered_set_destroy(ab); crabs_ot_ordered_set_destroy(ba);
}

static void test_associativity(void) {
  crabs_ot_ordered_set_t *a = singleton("A", 1);
  crabs_ot_ordered_set_t *b = singleton("B", 2);
  crabs_ot_ordered_set_t *c = singleton("C", 3);
  crabs_ot_ordered_set_t *left = clone_set(a);
  crabs_ot_ordered_set_t *bc = clone_set(b);
  crabs_ot_ordered_set_t *right = clone_set(a);
  assert(crabs_ot_ordered_set_merge(left, b) == left);
  assert(crabs_ot_ordered_set_merge(left, c) == left);
  assert(crabs_ot_ordered_set_merge(bc, c) == bc);
  assert(crabs_ot_ordered_set_merge(right, bc) == right);
  assert(same_state(left, right));
  assert(valid_links_and_counts(left));
  crabs_ot_ordered_set_destroy(a); crabs_ot_ordered_set_destroy(b);
  crabs_ot_ordered_set_destroy(c); crabs_ot_ordered_set_destroy(left);
  crabs_ot_ordered_set_destroy(bc); crabs_ot_ordered_set_destroy(right);
}

static void test_idempotence_and_deletion(void) {
  crabs_ot_ordered_set_t *set = sequence3();
  crabs_ot_ordered_set_t *before = clone_set(set);
  assert(crabs_ot_ordered_set_merge(set, set) == set);
  assert(same_state(set, before));

  crabs_ot_ordered_set_t *deleted = clone_set(before);
  deleted->head->deleted = true;
  deleted->visible_count--;
  assert(crabs_ot_ordered_set_merge(set, deleted) == set);
  assert(set->head->deleted);
  assert(valid_links_and_counts(set));
  crabs_ot_ordered_set_destroy(set); crabs_ot_ordered_set_destroy(before);
  crabs_ot_ordered_set_destroy(deleted);
}

static void test_payload_conflict_is_atomic(void) {
  crabs_ot_ordered_set_t *left = singleton("A", 1);
  crabs_ot_ordered_set_t *right = singleton("A", 2);
  crabs_ot_ordered_set_t *before = clone_set(left);
  assert(crabs_ot_ordered_set_merge(left, right) == NULL);
  assert(same_state(left, before));
  crabs_ot_ordered_set_destroy(left); crabs_ot_ordered_set_destroy(right);
  crabs_ot_ordered_set_destroy(before);
}

static void test_concurrent_move_lww(void) {
  crabs_ot_ordered_set_t *base = sequence3();
  crabs_ot_ordered_set_t *low = clone_set(base);
  crabs_ot_ordered_set_t *high = clone_set(base);
  crabs_ot_operation_t low_move = move_op("M", 1, 0, 2);
  crabs_ot_operation_t high_move = move_op("M", 2, 2, 0);
  assert(crabs_ot_ordered_set_apply_move(low, &low_move) != NULL);
  assert(crabs_ot_ordered_set_apply_move(high, &high_move) != NULL);
  crabs_ot_ordered_set_t *lh = clone_set(low);
  crabs_ot_ordered_set_t *hl = clone_set(high);
  assert(crabs_ot_ordered_set_merge(lh, high) == lh);
  assert(crabs_ot_ordered_set_merge(hl, low) == hl);
  assert(same_state(lh, hl));
  assert(strcmp(lh->head->id.node_id, "C") == 0);
  assert(valid_links_and_counts(lh));
  crabs_ot_ordered_set_destroy(base); crabs_ot_ordered_set_destroy(low);
  crabs_ot_ordered_set_destroy(high); crabs_ot_ordered_set_destroy(lh);
  crabs_ot_ordered_set_destroy(hl);
}

int main(void) {
  test_commutativity();
  test_associativity();
  test_idempotence_and_deletion();
  test_payload_conflict_is_atomic();
  test_concurrent_move_lww();
  puts("PASS: 5 ordered-set repair regression groups");
  return 0;
}
