#include <stdbool.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#include "OT/ot_ordered_set.h"
#include "generated/cases.h"

#define EVF_NORMAL_CAPACITY 8192u
#define EVF_MAX_ELEMENTS 8u

typedef struct {
  char bytes[EVF_NORMAL_CAPACITY];
  size_t length;
  bool valid;
  const crabs_ordered_element_t *nodes[EVF_MAX_ELEMENTS];
  const uint8_t *values[EVF_MAX_ELEMENTS];
  size_t element_count;
} evf_snapshot_t;

typedef struct {
  bool construction_ok;
  bool inputs_disjoint;
  bool merge_success;
  bool source_unchanged;
  bool rejection_destination_unchanged;
  bool invariants_ok;
  bool oracle_ok;
  unsigned merge_calls;
  unsigned merge_rejections;
  char visible_order[8];
  char normal_form[EVF_NORMAL_CAPACITY];
} evf_result_t;

static void init_id(crabs_ot_op_id_t *id, char node, uint64_t sequence) {
  memset(id, 0, sizeof(*id));
  id->node_id[0] = node;
  id->sequence_num = sequence;
  id->timestamp = 0;
}

static crabs_ot_operation_t insert_operation(char node, uint64_t position,
                                             uint8_t *payload) {
  crabs_ot_operation_t operation;
  memset(&operation, 0, sizeof(operation));
  init_id(&operation.id, node, 1);
  operation.op_type = CRABS_OT_OP_INSERT;
  operation.visible_pos = position;
  operation.payload = payload;
  operation.payload_size = 1;
  return operation;
}

static crabs_ot_operation_t move_operation(uint64_t sequence) {
  crabs_ot_operation_t operation;
  memset(&operation, 0, sizeof(operation));
  init_id(&operation.id, 'M', sequence);
  operation.op_type = CRABS_OT_OP_MOVE;
  operation.visible_pos = 1;
  operation.visible_pos_2 = 0;
  operation.payload = NULL;
  operation.payload_size = 0;
  return operation;
}

static bool apply_insert(crabs_ot_ordered_set_t *set, char node,
                         uint64_t position, uint8_t value) {
  crabs_ot_operation_t operation = insert_operation(node, position, &value);
  return crabs_ot_ordered_set_apply_insert(set, &operation) != NULL;
}

static crabs_ot_ordered_set_t *build_role(evf_role_t role,
                                          evf_delivery_t delivery,
                                          evf_version_t version,
                                          bool *ok) {
  crabs_ot_ordered_set_t *set = crabs_ot_ordered_set_create();
  *ok = set != NULL;
  if (!*ok) return set;

  *ok = apply_insert(set, 'A', 0, 1);
  if (*ok && role == EVF_ROLE_RAB) {
    *ok = apply_insert(set, 'B', 1, 2);
  } else if (*ok && role == EVF_ROLE_RAC) {
    *ok = apply_insert(set, 'C', 1, 3);
  } else if (*ok && role == EVF_ROLE_RFULL) {
    if (delivery == EVF_DELIVERY_BC) {
      *ok = apply_insert(set, 'B', 1, 2) && apply_insert(set, 'C', 1, 3);
    } else {
      *ok = apply_insert(set, 'C', 1, 3) && apply_insert(set, 'B', 1, 2);
    }
  }

  if (*ok && (role == EVF_ROLE_RAB || role == EVF_ROLE_RAC)) {
    uint64_t sequence = 1;
    if ((role == EVF_ROLE_RAB && version == EVF_VERSION_B_NEWER) ||
        (role == EVF_ROLE_RAC && version == EVF_VERSION_C_NEWER)) {
      sequence = 2;
    }
    crabs_ot_operation_t operation = move_operation(sequence);
    *ok = crabs_ot_ordered_set_apply_move(set, &operation) != NULL;
  }
  return set;
}

static bool valid_links_and_counts(const crabs_ot_ordered_set_t *set) {
  if (set == NULL) return false;
  uint32_t count = 0;
  uint32_t visible = 0;
  const crabs_ordered_element_t *previous = NULL;
  const crabs_ordered_element_t *element = set->head;
  while (element != NULL) {
    if (count > set->count || element->prev != previous) return false;
    previous = element;
    count++;
    if (!element->deleted) visible++;
    element = element->next;
  }
  return previous == set->tail && count == set->count &&
         visible == set->visible_count &&
         ((set->head == NULL && set->tail == NULL) ||
          (set->head != NULL && set->tail != NULL &&
           set->head->prev == NULL && set->tail->next == NULL));
}

static void append_text(evf_snapshot_t *snapshot, const char *format, ...) {
  if (!snapshot->valid || snapshot->length >= sizeof(snapshot->bytes)) return;
  va_list arguments;
  va_start(arguments, format);
  int written = vsnprintf(snapshot->bytes + snapshot->length,
                          sizeof(snapshot->bytes) - snapshot->length,
                          format, arguments);
  va_end(arguments);
  if (written < 0 || (size_t)written >= sizeof(snapshot->bytes) - snapshot->length) {
    snapshot->valid = false;
    return;
  }
  snapshot->length += (size_t)written;
}

static void append_id(evf_snapshot_t *snapshot, const crabs_ot_op_id_t *id) {
  for (size_t index = 0; index < CRABS_MAX_USER_ID; index++) {
    append_text(snapshot, "%02x", (unsigned char)id->node_id[index]);
  }
  append_text(snapshot, ":%llu:%llu", (unsigned long long)id->sequence_num,
              (unsigned long long)id->timestamp);
}

static evf_snapshot_t snapshot_set(const crabs_ot_ordered_set_t *set) {
  evf_snapshot_t snapshot;
  memset(&snapshot, 0, sizeof(snapshot));
  snapshot.valid = set != NULL && valid_links_and_counts(set);
  if (set == NULL) {
    append_text(&snapshot, "null");
    return snapshot;
  }
  append_text(&snapshot, "count=%u;visible=%u;head-prev=%u;tail-next=%u;",
              set->count, set->visible_count,
              set->head == NULL || set->head->prev == NULL,
              set->tail == NULL || set->tail->next == NULL);
  const crabs_ordered_element_t *element = set->head;
  size_t index = 0;
  while (element != NULL && index < EVF_MAX_ELEMENTS) {
    snapshot.nodes[index] = element;
    snapshot.values[index] = element->value;
    append_text(&snapshot, "e%zu{id=", index);
    append_id(&snapshot, &element->id);
    append_text(&snapshot, ",size=%u,value=", element->value_size);
    for (uint32_t byte = 0; byte < element->value_size; byte++) {
      append_text(&snapshot, "%02x", element->value[byte]);
    }
    append_text(&snapshot, ",deleted=%u,anchor=%u,anchor-id=",
                element->deleted, element->has_anchor);
    append_id(&snapshot, &element->anchor_id);
    append_text(&snapshot, ",placement=");
    append_id(&snapshot, &element->placement_id);
    append_text(&snapshot, ",prev-ok=%u,next-prev-ok=%u};",
                element->prev == (index == 0 ? NULL : snapshot.nodes[index - 1]),
                element->next == NULL || element->next->prev == element);
    index++;
    element = element->next;
  }
  snapshot.element_count = index;
  if (element != NULL || index != set->count) snapshot.valid = false;
  append_text(&snapshot, "structure-valid=%u", snapshot.valid);
  return snapshot;
}

static bool snapshot_equal(const evf_snapshot_t *left,
                           const evf_snapshot_t *right) {
  if (left->valid != right->valid || left->length != right->length ||
      left->element_count != right->element_count ||
      memcmp(left->bytes, right->bytes, left->length) != 0) {
    return false;
  }
  for (size_t index = 0; index < left->element_count; index++) {
    if (left->nodes[index] != right->nodes[index] ||
        left->values[index] != right->values[index]) return false;
  }
  return true;
}

static bool sets_disjoint(const crabs_ot_ordered_set_t *left,
                          const crabs_ot_ordered_set_t *right) {
  for (const crabs_ordered_element_t *a = left->head; a != NULL; a = a->next) {
    for (const crabs_ordered_element_t *b = right->head; b != NULL; b = b->next) {
      if (a == b || (a->value != NULL && a->value == b->value)) return false;
    }
  }
  return true;
}

static void visible_order(const crabs_ot_ordered_set_t *set, char output[8]) {
  size_t index = 0;
  for (const crabs_ordered_element_t *element = set->head;
       element != NULL && index < 7; element = element->next) {
    if (!element->deleted) output[index++] = element->id.node_id[0];
  }
  output[index] = '\0';
}

static const char *json_bool(bool value);

static bool measured_merge(crabs_ot_ordered_set_t *destination,
                           const crabs_ot_ordered_set_t *source,
                           evf_result_t *result, unsigned merge_index) {
  evf_snapshot_t destination_before = snapshot_set(destination);
  evf_snapshot_t source_before = snapshot_set(source);
  result->merge_calls++;
  crabs_ot_ordered_set_t *returned = crabs_ot_ordered_set_merge(destination, source);
  evf_snapshot_t destination_after = snapshot_set(destination);
  evf_snapshot_t source_after = snapshot_set(source);
  bool source_stable = snapshot_equal(&source_before, &source_after);
  bool destination_stable = snapshot_equal(&destination_before, &destination_after);
  result->source_unchanged = result->source_unchanged &&
                             source_stable;
  printf("{\"type\":\"merge\",\"merge_index\":%u,\"returned\":\"%s\","
         "\"destination_before\":\"%s\",\"destination_after\":\"%s\","
         "\"source_before\":\"%s\",\"source_after\":\"%s\","
         "\"source_unchanged\":%s,\"destination_unchanged\":%s,"
         "\"destination_valid\":%s}\n",
         merge_index, returned == destination ? "destination" :
                      (returned == NULL ? "null" : "other"),
         destination_before.bytes, destination_after.bytes,
         source_before.bytes, source_after.bytes, json_bool(source_stable),
         json_bool(destination_stable), json_bool(destination_after.valid));
  if (returned == NULL) {
    result->merge_rejections++;
    result->merge_success = false;
    result->rejection_destination_unchanged =
        result->rejection_destination_unchanged &&
        destination_stable;
    return false;
  }
  if (returned != destination) {
    result->merge_success = false;
    result->invariants_ok = false;
    return false;
  }
  result->invariants_ok = result->invariants_ok && destination_after.valid;
  result->inputs_disjoint = result->inputs_disjoint &&
                            sets_disjoint(destination, source);
  return true;
}

static evf_result_t run_case(const evf_case_definition_t *definition) {
  evf_result_t result;
  memset(&result, 0, sizeof(result));
  result.construction_ok = true;
  result.inputs_disjoint = true;
  result.merge_success = true;
  result.source_unchanged = true;
  result.rejection_destination_unchanged = true;
  result.invariants_ok = true;

  crabs_ot_ordered_set_t *sets[3] = {NULL, NULL, NULL};
  for (size_t index = 0; index < 3; index++) {
    bool built = false;
    sets[index] = build_role(definition->roles[index], definition->delivery,
                             definition->version, &built);
    result.construction_ok = result.construction_ok && built &&
                             valid_links_and_counts(sets[index]);
  }
  if (result.construction_ok) {
    result.inputs_disjoint = sets_disjoint(sets[0], sets[1]) &&
                             sets_disjoint(sets[0], sets[2]) &&
                             sets_disjoint(sets[1], sets[2]);
  }

  crabs_ot_ordered_set_t *final = sets[0];
  if (result.construction_ok && result.inputs_disjoint) {
    if (definition->association == EVF_ASSOC_LEFT) {
      if (measured_merge(sets[0], sets[1], &result, 1)) {
        (void)measured_merge(sets[0], sets[2], &result, 2);
      }
    } else {
      if (measured_merge(sets[1], sets[2], &result, 1)) {
        (void)measured_merge(sets[0], sets[1], &result, 2);
      }
    }
  } else {
    result.merge_success = false;
    result.invariants_ok = false;
  }

  evf_snapshot_t final_snapshot = snapshot_set(final);
  result.invariants_ok = result.invariants_ok && final_snapshot.valid;
  visible_order(final, result.visible_order);
  result.oracle_ok = result.merge_success &&
                     strcmp(result.visible_order, definition->expected_order) == 0;
  memcpy(result.normal_form, final_snapshot.bytes, final_snapshot.length + 1);

  for (size_t index = 0; index < 3; index++) {
    crabs_ot_ordered_set_destroy(sets[index]);
  }
  return result;
}

static const evf_case_definition_t *find_case(const char *case_id) {
  for (size_t index = 0; index < EVF_CASE_COUNT; index++) {
    if (strcmp(EVF_CASES[index].case_id, case_id) == 0) return &EVF_CASES[index];
  }
  return NULL;
}

static const char *json_bool(bool value) { return value ? "true" : "false"; }

int main(int argc, char **argv) {
  if (argc != 3 || strcmp(argv[1], "--case-id") != 0) {
    fputs("usage: partial_knowledge_move --case-id <stable-case-id>\n", stderr);
    return 2;
  }
  const evf_case_definition_t *definition = find_case(argv[2]);
  if (definition == NULL) {
    fputs("unknown case id\n", stderr);
    return 2;
  }
  evf_result_t result = run_case(definition);
  printf("{\"type\":\"summary\",\"case_id\":\"%s\",\"construction_ok\":%s,"
         "\"inputs_disjoint\":%s,\"merge_success\":%s,"
         "\"source_unchanged\":%s,"
         "\"rejection_destination_unchanged\":%s,"
         "\"invariants_ok\":%s,\"oracle_ok\":%s,"
         "\"merge_calls\":%u,\"merge_rejections\":%u,"
         "\"visible_order\":\"%s\",\"normal_form\":\"%s\"}\n",
         definition->case_id, json_bool(result.construction_ok),
         json_bool(result.inputs_disjoint), json_bool(result.merge_success),
         json_bool(result.source_unchanged),
         json_bool(result.rejection_destination_unchanged),
         json_bool(result.invariants_ok), json_bool(result.oracle_ok),
         result.merge_calls, result.merge_rejections, result.visible_order,
         result.normal_form);
  return 0;
}
