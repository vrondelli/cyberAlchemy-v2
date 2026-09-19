/* Finite demonstration only. This is not CRABS code or a CRABS proof. */
#include <stdio.h>
#include <string.h>

static void insert(int *values, int *count, int value, int ordered) {
  int position = *count;
  if (ordered) {
    while (position > 0 && values[position - 1] > value) {
      values[position] = values[position - 1];
      --position;
    }
  }
  values[position] = value;
  ++*count;
}

int main(int argc, char **argv) {
  const int permutations[6][3] = {{1,2,3}, {1,3,2}, {2,1,3}, {2,3,1}, {3,1,2}, {3,2,1}};
  char mode[32];
  FILE *input;
  int ordered, failed = 0;
  if (argc != 3 || strcmp(argv[1], "--input") != 0) return 2;
  input = fopen(argv[2], "rb");
  if (!input) return 2;
  if (!fgets(mode, sizeof mode, input)) { fclose(input); return 2; }
  if (fgetc(input) != EOF) { fclose(input); return 2; }
  fclose(input);
  mode[strcspn(mode, "\r\n")] = '\0';
  if (strcmp(mode, "ordered") == 0) ordered = 1;
  else if (strcmp(mode, "arrival") == 0) ordered = 0;
  else return 2;
  for (int p = 0; p < 6; ++p) {
    int values[3] = {0,0,0};
    int count = 0;
    for (int i = 0; i < 3; ++i) insert(values, &count, permutations[p][i], ordered);
    if (count != 3 || values[0] != 1 || values[1] != 2 || values[2] != 3) ++failed;
  }
  printf("{\"outcome\":\"%s\",\"reason_code\":\"%s\",\"cases\":6,\"failed_cases\":%d}\n",
         failed ? "fail" : "pass", failed ? "ORDER_MISMATCH" : "ORDER_PRESERVED", failed);
  return 0; /* Report semantic failure in JSON; process failure is a different outcome. */
}
