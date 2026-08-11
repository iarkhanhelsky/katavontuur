import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const contentRoot = path.join(root, 'content');

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    invariant(entry?.id, `${label}: missing id`);
    invariant(!ids.has(entry.id), `${label}: duplicate id ${entry.id}`);
    ids.add(entry.id);
  }
  return ids;
}

function expandIds(level, replicasById) {
  const platforms = [...level.platforms];
  const objects = [...level.objects];
  for (const instance of level.replicaBlobs || []) {
    const replica = replicasById.get(instance.replicaId);
    invariant(replica, `${level.id}: missing replica ${instance.replicaId}`);
    platforms.push(...(replica.platforms || []).map(entry => ({ ...entry, id: `${instance.id}.${entry.id}` })));
    objects.push(...(replica.objects || []).map(entry => ({ ...entry, id: `${instance.id}.${entry.id}` })));
  }
  return { platforms, objects };
}

function spawnIsSupported(level, platforms) {
  const footX = level.spawn.position.x + 26;
  const footY = level.spawn.position.y + 68;
  return platforms.some(platform => {
    const x = platform.position.x;
    const y = platform.position.y;
    return footX >= x && footX <= x + platform.size.width && Math.abs(footY - y) <= 2;
  });
}

function guardRouteIsSupported(guard, platforms) {
  const routeMin = guard.route?.minX ?? guard.position.x;
  const routeMax = guard.route?.maxX ?? guard.position.x;
  const surfaceY = guard.position.y + 60;
  return [guard.position.x, routeMin, routeMax].every(x => platforms.some(platform => (
    Math.abs(platform.position.y - surfaceY) <= 2
    && x >= platform.position.x
    && x <= platform.position.x + platform.size.width
  )));
}

const manifest = await json(path.join(contentRoot, 'items.json'));
invariant(manifest.schemaVersion === 1, 'items.json: unsupported schema version');
const itemIds = unique(manifest.items, 'items.json');
const itemsById = new Map(manifest.items.map(item => [item.id, item]));
invariant(itemIds.has(manifest.defaultLocationId), 'items.json: default location is missing');

const replicaLibrary = await json(path.join(contentRoot, manifest.replicaFile));
const replicaIds = unique(replicaLibrary.replicas, 'replicas.json');
const replicasById = new Map(replicaLibrary.replicas.map(replica => [replica.id, replica]));
let platformTotal = 0;
let objectTotal = 0;
let levelTotal = 0;

for (const location of manifest.items.filter(item => item.kind === 'location' && item.levelFile)) {
  const level = await json(path.join(contentRoot, location.levelFile));
  invariant(level.schemaVersion === 1, `${level.id}: unsupported schema version`);
  invariant(level.bounds.width >= 1280 && level.bounds.height >= 720, `${level.id}: bounds are smaller than the playfield`);
  invariant(level.spawn?.position && level.exit?.position, `${level.id}: spawn and exit are required`);
  invariant(level.spawn.position.x >= level.bounds.x && level.spawn.position.x < level.bounds.width, `${level.id}: spawn is outside bounds`);
  invariant(level.exit.position.x >= level.bounds.x && level.exit.position.x < level.bounds.width, `${level.id}: exit is outside bounds`);
  for (const questId of level.questIds || location.questIds || []) {
    invariant(itemsById.get(questId)?.kind === 'quest', `${level.id}: missing quest ${questId}`);
  }
  for (const object of level.objects) {
    if (object.item) invariant(itemsById.get(object.item)?.kind === 'object', `${level.id}: missing archetype ${object.item}`);
  }
  const expanded = expandIds(level, replicasById);
  unique(expanded.platforms, `${level.id} platforms`);
  unique(expanded.objects, `${level.id} objects`);
  for (const platform of expanded.platforms) invariant(platform.size?.width > 0 && platform.size?.height > 0, `${level.id}: invalid platform ${platform.id}`);
  invariant(spawnIsSupported(level, expanded.platforms), `${level.id}: spawn is not supported by a platform`);
  for (const guard of level.objects.filter(object => object.type === 'enemy' && object.variant === 'raccoon')) {
    const routeMin = guard.route?.minX ?? guard.position.x;
    const routeMax = guard.route?.maxX ?? guard.position.x;
    invariant(Number.isFinite(routeMin) && Number.isFinite(routeMax), `${level.id}: guard ${guard.id} has an invalid route`);
    invariant(guard.position.x >= Math.min(routeMin, routeMax) && guard.position.x <= Math.max(routeMin, routeMax), `${level.id}: guard ${guard.id} spawns outside its route`);
    invariant(guardRouteIsSupported(guard, expanded.platforms), `${level.id}: guard ${guard.id} patrols without platform support`);
  }
  const directLoot = level.objects.filter(object => object.type === 'loot' || itemsById.get(object.item)?.defaults?.type === 'loot').length;
  const replicaLoot = (level.replicaBlobs || []).reduce((sum, instance) => {
    const replica = replicasById.get(instance.replicaId);
    return sum + (replica.objects || []).filter(object => object.type === 'loot').length
      + (replica.objects || []).filter(object => object.type === 'cache').reduce((cacheSum, cache) => {
        const override = instance.overrides?.[cache.id];
        return cacheSum + (override?.contents || cache.contents || []).filter(item => item.type === 'loot').length;
      }, 0);
  }, 0);
  invariant((level.goal.requiredLoot || 0) <= directLoot + replicaLoot, `${level.id}: required loot exceeds available loot`);
  platformTotal += expanded.platforms.length;
  objectTotal += expanded.objects.length;
  levelTotal += 1;
}

console.log(`Validated ${levelTotal} levels, ${itemIds.size} items, ${replicaIds.size} replica blobs, ${platformTotal} platforms, and ${objectTotal} objects.`);
