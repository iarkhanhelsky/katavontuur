(() => {
  'use strict';

  const SUPPORTED_SCHEMA_VERSION = 1;
  const OBJECT_TYPES = new Set(['loot', 'hazard', 'enemy', 'checkpoint', 'decor', 'cache', 'trigger']);

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function merge(base, override) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) return clone(override ?? base);
    const result = clone(base) || {};
    for (const [key, value] of Object.entries(override)) {
      result[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(result[key], value)
        : clone(value);
    }
    return result;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(`[content] ${message}`);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`[content] Could not load ${url} (${response.status})`);
    try {
      return await response.json();
    } catch (error) {
      throw new Error(`[content] Invalid JSON in ${url}: ${error.message}`);
    }
  }

  function offsetPoint(point, origin) {
    if (!point) return point;
    return { ...point, x: (point.x || 0) + origin.x, y: (point.y || 0) + origin.y };
  }

  function translatePlacement(source, origin) {
    const result = clone(source);
    if (result.position) result.position = offsetPoint(result.position, origin);
    if (result.route) {
      result.route.minX = (result.route.minX || 0) + origin.x;
      result.route.maxX = (result.route.maxX || 0) + origin.x;
    }
    if (result.zone) result.zone = offsetPoint(result.zone, origin);
    if (result.contents) result.contents = result.contents.map(item => translatePlacement(item, origin));
    return result;
  }

  function expandReplica(instance, definition) {
    const origin = instance.at || { x: 0, y: 0 };
    const overrides = instance.overrides || {};
    const prefix = instance.id;
    const expand = entry => {
      const customized = merge(entry, overrides[entry.id]);
      const translated = translatePlacement(customized, origin);
      translated.localId = entry.id;
      translated.id = `${prefix}.${entry.id}`;
      translated.replicaInstanceId = prefix;
      if (translated.contents) {
        translated.contents = translated.contents.map(content => ({
          ...content,
          localId: content.id,
          id: `${prefix}.${entry.id}.${content.id}`,
          replicaInstanceId: prefix
        }));
      }
      return translated;
    };
    return {
      platforms: (definition.platforms || []).map(expand),
      objects: (definition.objects || []).map(expand)
    };
  }

  function indexUnique(entries, label) {
    const index = new Map();
    for (const entry of entries) {
      assert(entry && typeof entry.id === 'string' && entry.id.length > 0, `${label} entry is missing an id`);
      assert(!index.has(entry.id), `Duplicate ${label} id "${entry.id}"`);
      index.set(entry.id, entry);
    }
    return index;
  }

  function validateManifest(manifest) {
    assert(manifest.schemaVersion === SUPPORTED_SCHEMA_VERSION, `Unsupported items schema version ${manifest.schemaVersion}`);
    assert(Array.isArray(manifest.items), 'items.json must contain an items array');
    const itemIndex = indexUnique(manifest.items, 'item');
    assert(itemIndex.has(manifest.defaultLocationId), `Default location "${manifest.defaultLocationId}" is missing`);
    for (const item of manifest.items) {
      assert(['location', 'quest', 'reward', 'object', 'tutorial'].includes(item.kind), `Unknown item kind "${item.kind}" on ${item.id}`);
      for (const field of ['questIds', 'rewardIds', 'requires', 'children', 'unlocks']) {
        for (const reference of item[field] || []) {
          assert(itemIndex.has(reference) || field === 'unlocks', `${item.id} references missing item "${reference}"`);
        }
      }
    }
    return itemIndex;
  }

  function validateLevel(level, location) {
    assert(level.schemaVersion === SUPPORTED_SCHEMA_VERSION, `${level.id || location.id}: unsupported level schema version`);
    assert(typeof level.id === 'string', `${location.id}: level id is required`);
    assert(level.bounds?.width >= 1280 && level.bounds?.height >= 720, `${level.id}: bounds must cover the 1280x720 playfield`);
    assert(Number.isFinite(level.spawn?.position?.x) && Number.isFinite(level.spawn?.position?.y), `${level.id}: spawn.position is required`);
    assert(Number.isFinite(level.exit?.position?.x) && Number.isFinite(level.exit?.position?.y), `${level.id}: exit.position is required`);
    assert(Array.isArray(level.platforms), `${level.id}: platforms must be an array`);
    assert(Array.isArray(level.objects), `${level.id}: objects must be an array`);
    indexUnique(level.platforms, `${level.id} platform`);
    const objectIndex = indexUnique(level.objects, `${level.id} object`);
    for (const object of objectIndex.values()) {
      assert(object.type || object.item, `${level.id}: ${object.id} needs a type or item reference`);
      assert(object.position && Number.isFinite(object.position.x) && Number.isFinite(object.position.y), `${level.id}: ${object.id} needs a position`);
    }
  }

  function compileLevel(level, location, replicasById, itemsById) {
    validateLevel(level, location);
    const platforms = clone(level.platforms);
    const objects = clone(level.objects);
    for (const instance of level.replicaBlobs || []) {
      assert(instance.id, `${level.id}: replica blob instance is missing an id`);
      const definition = replicasById.get(instance.replicaId);
      assert(definition, `${level.id}: replica "${instance.replicaId}" does not exist`);
      const expanded = expandReplica(instance, definition);
      platforms.push(...expanded.platforms);
      objects.push(...expanded.objects);
    }

    const resolvedObjects = objects.map(object => {
      if (!object.item) return object;
      const archetype = itemsById.get(object.item);
      assert(archetype?.kind === 'object', `${level.id}: missing object archetype "${object.item}"`);
      return merge(archetype.defaults || {}, object);
    });
    const platformIndex = indexUnique(platforms, `${level.id} compiled platform`);
    const objectIndex = indexUnique(resolvedObjects, `${level.id} compiled object`);
    for (const platform of platformIndex.values()) {
      assert(platform.position && platform.size?.width > 0 && platform.size?.height > 0, `${level.id}: invalid platform ${platform.id}`);
    }
    for (const object of objectIndex.values()) {
      assert(OBJECT_TYPES.has(object.type), `${level.id}: unknown object type "${object.type}" on ${object.id}`);
    }
    const questIds = level.questIds || location.questIds || [];
    const quests = questIds.map(id => {
      const quest = itemsById.get(id);
      assert(quest?.kind === 'quest', `${level.id}: missing quest "${id}"`);
      return clone(quest);
    });
    const requiredLoot = Number(level.goal?.requiredLoot || 0);
    const collectibleCount = resolvedObjects.filter(object => object.type === 'loot').length
      + resolvedObjects.filter(object => object.type === 'cache').reduce((sum, cache) => sum + (cache.contents || []).filter(item => item.type === 'loot').length, 0);
    assert(requiredLoot <= collectibleCount, `${level.id}: goal needs ${requiredLoot} loot but only ${collectibleCount} is available`);

    const legacy = {
      platforms: platforms.map(platform => ({
        id: platform.id,
        x: platform.position.x,
        y: platform.position.y,
        w: platform.size.width,
        h: platform.size.height,
        kind: platform.kind || 'stone'
      })),
      hazards: [],
      loot: [],
      enemies: [],
      checkpoints: [],
      decor: [],
      caches: [],
      triggers: []
    };

    for (const object of resolvedObjects) {
      const common = { id: object.id, x: object.position.x, y: object.position.y };
      if (object.type === 'loot') legacy.loot.push({ ...common, type: object.variant || 'candy', tags: clone(object.tags || []) });
      if (object.type === 'hazard') legacy.hazards.push({ ...common, w: object.size.width, h: object.size.height, type: object.variant || 'spikes' });
      if (object.type === 'enemy') legacy.enemies.push({
        ...common,
        type: object.variant || 'raccoon',
        role: object.role || 'sleepy',
        facing: object.facing,
        min: object.route?.minX ?? object.position.x,
        max: object.route?.maxX ?? object.position.x,
        speed: object.speed ?? 70
      });
      if (object.type === 'checkpoint') legacy.checkpoints.push({
        ...common,
        label: object.label || 'Checkpoint reached',
        respawnOffset: clone(object.respawnOffset || { x: 20, y: 0 }),
        objective: object.objective
      });
      if (object.type === 'decor') legacy.decor.push({ ...common, type: object.variant, scale: object.scale, flip: object.flip });
      if (object.type === 'cache') legacy.caches.push({ ...common, ...clone(object), x: object.position.x, y: object.position.y });
      if (object.type === 'trigger') legacy.triggers.push({ ...common, ...clone(object), x: object.position.x, y: object.position.y });
    }

    return {
      ...clone(level),
      location: clone(location),
      quests,
      platforms,
      objects: resolvedObjects,
      objectIndex,
      platformIndex,
      legacy,
      requiredLoot,
      collectibleCount
    };
  }

  function compare(actual, operator, expected) {
    if (operator === 'eq') return actual === expected;
    if (operator === 'gte') return actual >= expected;
    if (operator === 'lte') return actual <= expected;
    if (operator === 'gt') return actual > expected;
    if (operator === 'lt') return actual < expected;
    return false;
  }

  function evaluateCondition(condition, state) {
    if (!condition) return true;
    if (condition.all) return condition.all.every(child => evaluateCondition(child, state));
    if (condition.any) return condition.any.some(child => evaluateCondition(child, state));
    if (condition.not) return !evaluateCondition(condition.not, state);
    if (condition.counter) return compare(state.counters?.[condition.counter] || 0, condition.op || 'gte', condition.value);
    if (condition.flag) return (state.flags?.[condition.flag] ?? false) === (condition.value ?? true);
    if (condition.collected) return state.collected?.has(condition.collected) || false;
    if (condition.reached) return state.reached?.has(condition.reached) || false;
    if (condition.input) return state.inputs?.has(condition.input) || false;
    return false;
  }

  class ContentSystem {
    constructor(manifestUrl, manifest, replicas, itemsById) {
      this.manifestUrl = manifestUrl;
      this.manifest = manifest;
      this.itemsById = itemsById;
      this.replicasById = indexUnique(replicas.replicas || [], 'replica');
    }

    static async load(manifestUrl = 'content/items.json') {
      const absoluteManifestUrl = new URL(manifestUrl, document.baseURI);
      const manifest = await fetchJson(absoluteManifestUrl);
      const itemsById = validateManifest(manifest);
      const replicaUrl = new URL(manifest.replicaFile, absoluteManifestUrl);
      const replicas = await fetchJson(replicaUrl);
      assert(replicas.schemaVersion === SUPPORTED_SCHEMA_VERSION, 'Unsupported replica schema version');
      return new ContentSystem(absoluteManifestUrl, manifest, replicas, itemsById);
    }

    getLocations() {
      return this.manifest.items.filter(item => item.kind === 'location' && item.levelFile).sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    async loadLevel(locationId = this.manifest.defaultLocationId) {
      const location = this.itemsById.get(locationId);
      assert(location?.kind === 'location' && location.levelFile, `Unknown playable location "${locationId}"`);
      const levelUrl = new URL(location.levelFile, this.manifestUrl);
      const level = await fetchJson(levelUrl);
      return compileLevel(level, location, this.replicasById, this.itemsById);
    }
  }

  window.HeistContent = Object.freeze({
    ContentSystem,
    evaluateCondition,
    compileLevel,
    supportedSchemaVersion: SUPPORTED_SCHEMA_VERSION
  });
})();
