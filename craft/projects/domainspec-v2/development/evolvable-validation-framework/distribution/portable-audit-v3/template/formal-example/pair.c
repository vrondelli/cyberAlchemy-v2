extern unsigned int nondet_uint(void);

struct Pair { unsigned int lo, hi; };

static struct Pair canonical_pair(unsigned int a, unsigned int b) {
    struct Pair result = a <= b ? (struct Pair){a, b} : (struct Pair){b, a};
    return result;
}

int main(void) {
    unsigned int a = nondet_uint();
    unsigned int b = nondet_uint();
    struct Pair ab = canonical_pair(a, b);
    struct Pair ba = canonical_pair(b, a);
    __CPROVER_assert(ab.lo == ba.lo && ab.hi == ba.hi, "PAIR_COMMUTATIVE");
    return 0;
}
