# Content system

Chapter One is authored as data. The browser loads one global item registry, one
replica-blob library, and one independent level file before enabling Play.

## Files

- `content/items.json` is the single game-wide registry. It owns stable IDs for
  locations, quests, rewards, and object archetypes. Playable locations point to
  their separate level file with `levelFile`.
- `content/replicas.json` contains reusable placement blobs. A blob can contain
  platforms and typed objects using coordinates relative to its origin.
- `content/levels/*.json` contains exact geometry and instances for one level:
  bounds, spawn, exit, platforms, objects, tutorial, goal, and badge conditions.
- `js/content-system.js` loads, validates, resolves archetypes, expands replica
  blobs, and compiles typed objects into the arrays consumed by the Canvas game.

Stable IDs are save-game and scripting identity. Do not derive them from array
indexes and do not rename them after a level ships without a save migration.

## Coordinates and anchors

The active game uses a fixed `1280x720` playfield.

- Platform, hazard, trigger, and exit positions are top-left coordinates.
- Loot positions are sprite/collection centers.
- Raccoon positions are patrol anchor points near ground level (`y: 530`).
- Decor positions are ground baselines (`y: 590`).
- A ground-spawned 52x68 player uses `y: 522` on a surface at `y: 590`.

## Object instances

An object can be fully explicit:

```json
{
  "id": "treat.bridge",
  "type": "loot",
  "variant": "candy",
  "tags": ["required"],
  "position": { "x": 880, "y": 510 }
}
```

Or it can inherit game-wide defaults from an item archetype:

```json
{
  "id": "treat.bridge",
  "item": "object.loot.candy",
  "tags": ["required"],
  "position": { "x": 880, "y": 510 }
}
```

Supported runtime types are `loot`, `hazard`, `enemy`, `checkpoint`, `decor`,
`cache`, and `trigger`. JSON is declarative; the runtime never evaluates script
strings.

## Replica blobs

Use a blob for a repeated authored pattern, not for an entire level:

```json
{
  "id": "post-two",
  "replicaId": "replica.guard-post",
  "at": { "x": 1800, "y": 590 },
  "overrides": {
    "guard": { "role": "nervous", "speed": 82 }
  }
}
```

Expansion preserves deterministic identity by namespacing children, for example
`post-two.guard` and `post-two.lamp`. Overrides are keyed by the blob-local ID.

## Conditions and actions

Goals, tutorials, and badge conditions use a small finite condition language:

- Boolean composition: `all`, `any`, `not`
- Counters: `{ "counter": "required", "op": "gte", "value": 5 }`
- Flags: `{ "flag": "ghostRescued" }`
- Identity state: `collected`, `reached`, or `input`
- Operators: `eq`, `gte`, `lte`, `gt`, and `lt`

Trigger actions currently support `setFlag`, `incrementCounter`, `objective`,
`toast`, and `unlockGhost`. Add new operations to the typed interpreter rather
than embedding JavaScript in content.

## Selecting a level

The default location comes from `items.json`. For authoring and smoke tests, use
the location ID, suffix, or order:

```text
/?level=location.guard-trouble
/?level=guard-trouble
/?level=3
```

Run `node scripts/validate-content.mjs` after editing content. It validates every
referenced level, stable IDs, object/archetype/replica references, bounds, spawn
support, and required-loot feasibility.
