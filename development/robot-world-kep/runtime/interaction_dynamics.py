"""Pure interaction-v1 mechanics. Questions: ../interaction-dynamics/REPORT.md."""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path

PROFILE_PATH = Path(__file__).resolve().parents[1] / 'interaction-dynamics/PROFILE.json'


def vector(value, n=None, lower=None, upper=None):
    if not isinstance(value, (list, tuple)) or not value or (n is not None and len(value) != n):
        raise ValueError('VECTOR_DIMENSION')
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or
           not math.isfinite(v) or (lower is not None and v < lower) or
           (upper is not None and v > upper) for v in value):
        raise ValueError('VECTOR_VALUE')
    return list(value)


def positive(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
        raise ValueError('POSITIVE_FINITE_REQUIRED')
    return value


def profile():
    return json.loads(PROFILE_PATH.read_text())


def semantic(prior, memory, gains):
    p = vector(prior, lower=0, upper=1)
    m = vector(memory, len(p), lower=0)
    g = vector(gains, len(p), lower=0)
    raw = vector([a+b*c for a,b,c in zip(p,m,g)])
    return [max(0.0, min(1.0, x)) for x in raw]


def memory_step(memory, rates, dt, impulses):
    m = vector(memory, lower=0)
    r = vector(rates, len(m), lower=0)
    if isinstance(dt, bool) or not isinstance(dt, (int,float)) or not math.isfinite(dt) or dt < 0:
        raise ValueError('DECAY_DT')
    i = vector(impulses, len(m), lower=0)
    return vector([a*math.exp(-b*dt)+c for a,b,c in zip(m,r,i)], len(m), lower=0)


def velocity(before, after, dt):
    b = vector(before)
    a = vector(after, len(b))
    positive(dt)
    return vector([(x-y)/dt for x,y in zip(a,b)])


def steer(position, speed, neighbors, scales, coefficients=None):
    p = vector(position)
    v = vector(speed, len(p))
    a = vector(scales, len(p))
    for x in a:
        positive(x)
    cfg = copy.deepcopy(profile()['steering'] if coefficients is None else coefficients)
    for name in ('radius','distance_floor','cap'):
        positive(cfg[name])
    vector([cfg[k] for k in ('separation','alignment','cohesion')], lower=0)
    q = vector([x/y for x,y in zip(p,a)])
    u = vector([x/y for x,y in zip(v,a)])
    terms = {key:[0.0]*len(p) for key in ('separation','alignment','cohesion')}
    neighbors = list(neighbors)
    for neighbor_p, neighbor_v in neighbors:
        np = vector(neighbor_p, len(p)); nv = vector(neighbor_v, len(p))
        nq = vector([x/y for x,y in zip(np,a)]); nu = vector([x/y for x,y in zip(nv,a)])
        delta = vector([x-y for x,y in zip(q,nq)])
        distance = math.hypot(*delta)
        if not math.isfinite(distance):
            raise ValueError('METRIC_OVERFLOW')
        for k in range(len(p)):
            sep = delta[k]/max(distance*distance,cfg['distance_floor']) if distance < cfg['radius'] else 0.0
            terms['separation'][k] += cfg['separation']*sep/len(neighbors)
            terms['alignment'][k] += cfg['alignment']*(nu[k]-u[k])/len(neighbors)
            terms['cohesion'][k] += cfg['cohesion']*(nq[k]-q[k])/len(neighbors)
    force = vector([sum(t[k] for t in terms.values()) for k in range(len(p))])
    magnitude = math.hypot(*force)
    if not math.isfinite(magnitude):
        raise ValueError('METRIC_OVERFLOW')
    factor = min(1.0,cfg['cap']/magnitude) if magnitude else 1.0
    bounded = [x*factor for x in force]
    return {'terms':terms,'scaled_force':bounded,
            'semantic_force':vector([x*y for x,y in zip(bounded,a)])}


def weights(state, force):
    s = vector(state, lower=0, upper=1)
    f = vector(force, len(s))
    return [max(0.0,min(1.0,x)) for x in vector([a+b for a,b in zip(s,f)])]
