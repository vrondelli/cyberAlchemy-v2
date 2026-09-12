#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "OT/ot_ordered_set.h"

static void init_id(crabs_ot_op_id_t *id, char node, uint64_t sequence) {
  memset(id, 0, sizeof(*id));
  id->node_id[0] = node;
  id->node_id[1] = '\0';
  id->sequence_num = sequence;
}

static void init_element(crabs_ordered_element_t *element, char node,
                         uint64_t sequence, uint8_t *value) {
  memset(element, 0, sizeof(*element));
  init_id(&element->id, node, sequence);
#ifdef REPAIRED_LAYOUT
  element->placement_id = element->id;
#endif
  element->value = value;
  element->value_size = 1;
}

static void init_singleton(crabs_ot_ordered_set_t *set,
                           crabs_ordered_element_t *element) {
  memset(set, 0, sizeof(*set));
  set->head = element;
  set->tail = element;
  set->count = 1;
  set->visible_count = 1;
  set->ot_data = NULL;
}

static int same_order(const crabs_ot_ordered_set_t *left,
                      const crabs_ot_ordered_set_t *right) {
  const crabs_ordered_element_t *a = left->head;
  const crabs_ordered_element_t *b = right->head;
  while (a != NULL && b != NULL) {
    if (!crabs_ot_op_id_equal(&a->id, &b->id)) return 0;
    a = a->next;
    b = b->next;
  }
  return a == NULL && b == NULL;
}

int main(void) {
  uint8_t value_a = 1;
  uint8_t value_b = 2;
  crabs_ordered_element_t ab_a, ba_b, source_a, source_b;
  crabs_ot_ordered_set_t ab, ba, a, b;

  init_element(&ab_a, 'A', 1, &value_a);
  init_element(&ba_b, 'B', 1, &value_b);
  init_element(&source_a, 'A', 1, &value_a);
  init_element(&source_b, 'B', 1, &value_b);
  init_singleton(&ab, &ab_a);
  init_singleton(&ba, &ba_b);
  init_singleton(&a, &source_a);
  init_singleton(&b, &source_b);

  assert(crabs_ot_ordered_set_merge(&ab, &b) == &ab);
  assert(crabs_ot_ordered_set_merge(&ba, &a) == &ba);
#ifndef __CPROVER__
  fprintf(stderr, "merge(A,B)=[%s,%s] merge(B,A)=[%s,%s]\n",
          ab.head->id.node_id, ab.head->next->id.node_id,
          ba.head->id.node_id, ba.head->next->id.node_id);
#endif
  assert(ab.count == 2 && ba.count == 2 && ab.visible_count == 2 && ba.visible_count == 2 &&
         ab.head != NULL && ab.head->next != NULL && ab.head->next->next == NULL &&
         ba.head != NULL && ba.head->next != NULL && ba.head->next->next == NULL &&
         crabs_ot_ordered_set_find(&ab, &source_a.id) != NULL &&
         crabs_ot_ordered_set_find(&ab, &source_b.id) != NULL &&
         crabs_ot_ordered_set_find(&ba, &source_a.id) != NULL &&
         crabs_ot_ordered_set_find(&ba, &source_b.id) != NULL && "both members preserved");
  assert(same_order(&ab, &ba) && "ordered-set merge must be commutative");
  return 0;
}
