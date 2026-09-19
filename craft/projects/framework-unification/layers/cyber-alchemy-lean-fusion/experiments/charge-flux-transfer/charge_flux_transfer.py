"""
charge_flux_transfer.py  -- empirical Step-0 for the §5g charge-vs-flux pivot. (v2)

v1 was DEGENERATE: spurious cue too dominant -> every model scored ~0% OOD ->
the outcome had no variance and the "survival" was noise in the 4th decimal.
v2 fixes the regime so transfer is ACHIEVABLE and VARIES, and builds the model
family by varying the spurious strength the model is TRAINED on (robust), not by
relying on an IRM optimizer.

Question: does the STRUCTURED conserved charge (reliance on the invariant subspace)
predict out-of-distribution transfer ORTHOGONALLY to every in-distribution SCALAR?

  charge = ||theta_core|| / ||theta||      (projection onto invariant subobject)
  proxy  = |acc(ref_env1) - acc(ref_env2)| (ground-truth-FREE invariance proxy)

COLLAPSE-TEST (§5f scalar trap):
  charge SURVIVES only if it predicts test_acc AFTER residualizing out the scalars
  (train_acc, train_loss, label-MI). Otherwise it is a number in disguise -> KILL.

Pure numpy. Deterministic.
"""

import numpy as np

D_CORE, D_SPUR = 5, 5
A_CORE = 0.70     # invariant signal (core-only acc ~ 0.88)
A_SPUR = 0.70     # spurious per-unit signal (comparable to core -- NOT overwhelming)

CORE_IDX = np.arange(0, D_CORE)
SPUR_IDX = np.arange(D_CORE, D_CORE + D_SPUR)

def gen_env(n, rho, label_noise=0.0, rng=None):
    y = rng.integers(0, 2, size=n)
    if label_noise > 0:
        y = np.where(rng.random(n) < label_noise, 1 - y, y)
    s = (2 * y - 1).astype(float)
    x_core = rng.normal(s[:, None] * A_CORE, 1.0, size=(n, D_CORE))
    x_spur = rng.normal(s[:, None] * (A_SPUR * rho), 1.0, size=(n, D_SPUR))
    return np.concatenate([x_core, x_spur], axis=1), y.astype(float)

def sigmoid(z): return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))
def ce(p, y):
    p = np.clip(p, 1e-7, 1 - 1e-7)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

def fit_erm(X, y, l2=1e-3, steps=1200, lr=0.5):
    theta = np.zeros(X.shape[1]); n = len(y)
    for _ in range(steps):
        p = sigmoid(X @ theta)
        g = X.T @ (p - y) / n + 2 * l2 * theta
        theta -= lr * g
    return theta

def accuracy(theta, X, y): return float(np.mean((sigmoid(X @ theta) > 0.5) == (y > 0.5)))
def loss(theta, X, y):     return ce(sigmoid(X @ theta), y)
def charge(theta):
    nc, ns = np.linalg.norm(theta[CORE_IDX]), np.linalg.norm(theta[SPUR_IDX])
    return float(nc / (nc + ns + 1e-12))
def label_mi_bits(theta, X, y):
    yh = (sigmoid(X @ theta) > 0.5).astype(int); yt = (y > 0.5).astype(int); mi = 0.0
    for a in (0, 1):
        for b in (0, 1):
            pab = np.mean((yh == a) & (yt == b)); pa = np.mean(yh == a); pb = np.mean(yt == b)
            if pab > 0 and pa > 0 and pb > 0: mi += pab * np.log2(pab / (pa * pb))
    return float(mi)

# ---- FIXED reference evaluation sets (comparable across all models) ----
rr = np.random.default_rng(777)
REF_RHO_E1, REF_RHO_E2 = 2.0, 1.0          # two reference train environments
REF_RHO_TEST = -1.0                        # OOD test: spurious correlation mildly flips
ref_e1 = gen_env(8000, REF_RHO_E1, rng=rr)
ref_e2 = gen_env(8000, REF_RHO_E2, rng=rr)
ref_train_X = np.concatenate([ref_e1[0], ref_e2[0]]); ref_train_y = np.concatenate([ref_e1[1], ref_e2[1]])
ref_test_X, ref_test_y = gen_env(16000, REF_RHO_TEST, rng=rr)

# ---- Model family: span spurious->invariant via the rho the model is TRAINED on ----
RHO_USED = [2.5, 1.8, 1.2, 0.7, 0.3, 0.0, -0.4]   # high rho -> spurious-reliant; 0 -> core-reliant
NOISES   = [0.0, 0.08, 0.16]                       # decouples train-loss from charge
SEEDS    = [1, 2, 3, 4]

records = []
for rho in RHO_USED:
    for noise in NOISES:
        for seed in SEEDS:
            rng = np.random.default_rng(2000 + seed * 31 + int((rho + 1) * 50) + int(noise * 100))
            Xa, ya = gen_env(3000, rho, label_noise=noise, rng=rng)
            Xb, yb = gen_env(3000, rho * 0.5, label_noise=noise, rng=rng)
            X = np.concatenate([Xa, Xb]); y = np.concatenate([ya, yb])
            theta = fit_erm(X, y)
            acc_e1 = accuracy(theta, *ref_e1); acc_e2 = accuracy(theta, *ref_e2)
            records.append(dict(
                rho=rho, noise=noise, seed=seed,
                train_acc=accuracy(theta, ref_train_X, ref_train_y),
                train_loss=loss(theta, ref_train_X, ref_train_y),
                mi=label_mi_bits(theta, ref_train_X, ref_train_y),
                charge=charge(theta),
                proxy_gap=abs(acc_e1 - acc_e2),          # ground-truth-free invariance proxy
                test_acc=accuracy(theta, ref_test_X, ref_test_y),
            ))

def col(n): return np.array([r[n] for r in records], float)
def pearson(a, b):
    a = a - a.mean(); b = b - b.mean(); d = np.linalg.norm(a) * np.linalg.norm(b)
    return float(a @ b / d) if d > 1e-12 else float('nan')
def spearman(a, b): return pearson(np.argsort(np.argsort(a)).astype(float), np.argsort(np.argsort(b)).astype(float))
def residualize(t, ctrls):
    X = np.column_stack([np.ones(len(t))] + list(ctrls))
    c, *_ = np.linalg.lstsq(X, t, rcond=None); return t - X @ c

train_acc, train_loss, mi = col("train_acc"), col("train_loss"), col("mi")
charge_v, proxy, test_acc = col("charge"), col("proxy_gap"), col("test_acc")

print("=" * 74)
print("CHARGE-vs-FLUX TRANSFER PROBE v2  (n_models = %d)" % len(records))
print("=" * 74)
print("ref train envs rho = [%.1f, %.1f] | OOD test rho = %.1f" % (REF_RHO_E1, REF_RHO_E2, REF_RHO_TEST))
print("train_acc : mean %.3f  range [%.3f, %.3f]" % (train_acc.mean(), train_acc.min(), train_acc.max()))
print("test_acc  : mean %.3f  range [%.3f, %.3f]   <-- must have real spread" % (test_acc.mean(), test_acc.min(), test_acc.max()))
print("charge    : mean %.3f  range [%.3f, %.3f]   <-- must have real spread" % (charge_v.mean(), charge_v.min(), charge_v.max()))
print("-" * 74)

print("\n[1] Does an in-distribution SCALAR predict transfer?  (want: weak)")
print("    corr(train_acc , test_acc) = %+.3f" % pearson(train_acc, test_acc))
print("    corr(train_loss, test_acc) = %+.3f" % pearson(train_loss, test_acc))
print("    corr(label_MI  , test_acc) = %+.3f" % pearson(mi, test_acc))

print("\n[2] Does the STRUCTURED CHARGE predict transfer?  (want: strong +)")
print("    corr(charge    , test_acc) = %+.3f" % pearson(charge_v, test_acc))
print("    corr(proxy_gap , test_acc) = %+.3f   (ground-truth-free; want negative)" % pearson(proxy, test_acc))

print("\n[3] COLLAPSE-TEST: charge AFTER residualizing out ALL scalars")
cr = residualize(charge_v, [train_acc, train_loss, mi]); tr = residualize(test_acc, [train_acc, train_loss, mi])
partial = pearson(cr, tr)
print("    partial corr(charge, test_acc | train_acc, train_loss, MI) = %+.3f" % partial)
print("    spearman version                                           = %+.3f" % spearman(cr, tr))
print("    (how much do scalars alone explain test_acc? R = %+.3f)" %
      pearson(test_acc, test_acc - tr))

print("\n[3b] same-loss-different-fate band (ResidueWiringUnderdetermined check)")
lo, hi = np.percentile(train_loss, 40), np.percentile(train_loss, 60)
band = (train_loss >= lo) & (train_loss <= hi)
if band.sum() >= 4:
    print("    %d models, train_loss in [%.4f, %.4f]" % (band.sum(), lo, hi))
    print("      test_acc spread : [%.3f, %.3f]  (delta %.3f)" %
          (test_acc[band].min(), test_acc[band].max(), test_acc[band].max() - test_acc[band].min()))
    print("      charge spread   : [%.3f, %.3f]" % (charge_v[band].min(), charge_v[band].max()))
    print("      corr(charge,test_acc) WITHIN band = %+.3f" % pearson(charge_v[band], test_acc[band]))

print("\n" + "=" * 74)
TH = 0.30
ok_variance = (test_acc.max() - test_acc.min() > 0.15) and (charge_v.max() - charge_v.min() > 0.10)
if not ok_variance:
    print("VERDICT: INVALID RUN -- insufficient spread in test_acc or charge. Fix the regime.")
elif abs(partial) >= TH:
    print("VERDICT: SURVIVES.  partial corr = %+.3f (|.| >= %.2f) on a VALID-variance run." % (partial, TH))
    print("  Charge predicts transfer beyond every scalar -> structured residue is NOT")
    print("  a number in disguise on this task.")
else:
    print("VERDICT: KILL.  partial corr = %+.3f (|.| < %.2f)." % (partial, TH))
    print("  Transfer is explained by the in-distribution scalar(s); structured charge")
    print("  adds nothing -> the §5f scalar trap bites empirically.")
print("=" * 74)
