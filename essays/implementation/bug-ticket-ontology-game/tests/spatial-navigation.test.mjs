import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeModel} from '../web/runtime-model.js';
import {canOccupy, segmentClear, findPath, fitStationVisual, inspectionPoint} from '../web/core/spatial-navigation.mjs';

test('a click across a machine routes around it, with no collision on any segment', () => {
  const bounds = {width:18, depth:14}, blockers = [{x:0,z:0,radius:1.7}];
  const start = {x:-4,z:0}, goal = {x:4,z:0};
  assert.equal(segmentClear(start, goal, bounds, blockers), false);
  const path = findPath(start, goal, bounds, blockers);
  assert.ok(path.length > 1);
  let previous = start;
  for (const waypoint of path) { assert.ok(segmentClear(previous, waypoint, bounds, blockers)); previous = waypoint; }
  assert.deepEqual(path.at(-1), goal);
  assert.equal(findPath(start, {x:0,z:0}, bounds, blockers), null);
});

test('every authored machine and door is reachable from every other inspection point', () => {
  for (const room of Object.values(runtimeModel.game.rooms)) {
    const {bounds, stations, exits} = room.spatial;
    const blockers = Object.entries(stations).map(([id,s]) => ({id,x:s.x,z:s.z,radius:Math.max(s.footprint.width,s.footprint.depth)/2 + 0.22}));
    const points = [{x:0,z:bounds.depth / 2 - 0.9}, ...Object.values(exits).map(e=>e.interaction_anchor)];
    for (const layout of Object.values(stations)) {
      const point = inspectionPoint(layout, layout.visual_size, 75, 16/9, bounds, blockers);
      assert.ok(point && canOccupy(point,bounds,blockers));
      points.push(point);
    }
    for (const a of points) for (const b of points) {
      const path = findPath(a,b,bounds,blockers);
      assert.ok(path, `${room.id}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
      let previous = a;
      for (const waypoint of path) {assert.ok(segmentClear(previous,waypoint,bounds,blockers));previous=waypoint;}
    }
  }
});

test('station artwork keeps its native proportions and fits the physical footprint', () => {
  for (const room of Object.values(runtimeModel.game.rooms)) for (const layout of Object.values(room.spatial.stations)) {
    for (const [w,h] of [[420,1350],[1509,967],[1250,988]]) {
      const fit = fitStationVisual(layout,w,h);
      assert.ok(Math.abs(fit.width/fit.height-w/h)<1e-10);
      assert.ok(fit.width<=layout.footprint.width+1e-10);
      assert.ok(fit.height<=layout.visual_size.height+1e-10);
    }
  }
});
