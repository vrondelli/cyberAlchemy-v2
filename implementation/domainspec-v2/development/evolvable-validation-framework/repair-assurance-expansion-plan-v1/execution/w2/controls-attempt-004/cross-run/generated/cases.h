#ifndef EVF_GENERATED_CASES_H
#define EVF_GENERATED_CASES_H

#include <stddef.h>

typedef enum { EVF_DELIVERY_BC = 0, EVF_DELIVERY_CB = 1 } evf_delivery_t;
typedef enum { EVF_VERSION_B_NEWER = 0, EVF_VERSION_C_NEWER = 1 } evf_version_t;
typedef enum { EVF_ROLE_RAB = 0, EVF_ROLE_RAC = 1, EVF_ROLE_RFULL = 2 } evf_role_t;
typedef enum { EVF_ASSOC_LEFT = 0, EVF_ASSOC_RIGHT = 1 } evf_assoc_t;

typedef struct {
  const char *case_id;
  evf_delivery_t delivery;
  evf_version_t version;
  evf_role_t roles[3];
  evf_assoc_t association;
  const char *expected_order;
} evf_case_definition_t;

#define EVF_CASE_SET_SHA256 "f679e95c5585b2b150197f82efb6d81f59caa26100719fe75b5526a492f616f6"
#define EVF_CASE_COUNT 48u

static const evf_case_definition_t EVF_CASES[EVF_CASE_COUNT] = {
  {"delivery-bc__version-b-newer__perm-rab-rac-rfull__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rab-rac-rfull__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rab-rfull-rac__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rab-rfull-rac__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rac-rab-rfull__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rac-rab-rfull__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rac-rfull-rab__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rac-rfull-rab__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rfull-rab-rac__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rfull-rab-rac__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rfull-rac-rab__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-bc__version-b-newer__perm-rfull-rac-rab__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-bc__version-c-newer__perm-rab-rac-rfull__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rab-rac-rfull__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rab-rfull-rac__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rab-rfull-rac__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rac-rab-rfull__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rac-rab-rfull__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rac-rfull-rab__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rac-rfull-rab__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rfull-rab-rac__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rfull-rab-rac__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rfull-rac-rab__assoc-left", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-bc__version-c-newer__perm-rfull-rac-rab__assoc-right", EVF_DELIVERY_BC, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-b-newer__perm-rab-rac-rfull__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rab-rac-rfull__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rab-rfull-rac__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rab-rfull-rac__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rac-rab-rfull__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rac-rab-rfull__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rac-rfull-rab__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rac-rfull-rab__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rfull-rab-rac__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rfull-rab-rac__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rfull-rac-rab__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "BAC"},
  {"delivery-cb__version-b-newer__perm-rfull-rac-rab__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_B_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "BAC"},
  {"delivery-cb__version-c-newer__perm-rab-rac-rfull__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rab-rac-rfull__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RAC, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rab-rfull-rac__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rab-rfull-rac__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAB, EVF_ROLE_RFULL, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rac-rab-rfull__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rac-rab-rfull__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RAB, EVF_ROLE_RFULL}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rac-rfull-rab__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rac-rfull-rab__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RAC, EVF_ROLE_RFULL, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rfull-rab-rac__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rfull-rab-rac__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAB, EVF_ROLE_RAC}, EVF_ASSOC_RIGHT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rfull-rac-rab__assoc-left", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_LEFT, "CAB"},
  {"delivery-cb__version-c-newer__perm-rfull-rac-rab__assoc-right", EVF_DELIVERY_CB, EVF_VERSION_C_NEWER, {EVF_ROLE_RFULL, EVF_ROLE_RAC, EVF_ROLE_RAB}, EVF_ASSOC_RIGHT, "CAB"},
};

#endif
