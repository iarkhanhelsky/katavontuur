# Nine Lives, One Heist

## Game Design Document

**Document status:** Chapter One design baseline  
**Genre:** Kid-friendly 2D platform adventure  
**Primary audience:** Ages 7–11  
**Platforms:** Desktop and mobile web, installable PWA  
**Session length:** 3–6 minutes per level  
**Campaign length:** Approximately 30–45 minutes for a first completion  
**Business model:** Self-contained game; no advertising, purchases, or social features

---

## 1. High concept

The Count has taken every treat in town and hidden the haul around his moonlit manor. A quick-footed cat burglar sneaks through the cemetery, courtyard, rooftops, and moon vault to recover the treats, outwit raccoon guards, and make a playful getaway with a tiny ghost accomplice.

The game combines forgiving platforming, light stealth, treasure collection, secrets, and slapstick reactions. It should feel adventurous and slightly spooky, but never threatening or punishing.

Chapter One uses the existing Moonlit Manor art set exclusively. Variety comes from level goals, enemy behaviour, route changes, lighting, treasure placement, and optional challenges rather than new environments or character assets.

## 2. Product vision

Create a short adventure children can understand without instruction, complete without frustration, and voluntarily replay to find secrets and earn paw badges.

### Design pillars

1. **Curiosity leads the way**  
   Treasure, light, signs, and character reactions naturally pull the player toward the next interaction.

2. **Mistakes are funny, not costly**  
   Failure causes a quick rescue and a small loss of time. It never erases an entire session in the default mode.

3. **One action, many uses**  
   Movement, jumping, and pouncing power traversal, enemy interactions, secrets, and challenges. New permanent buttons are avoided.

4. **Frequent delight**  
   The game delivers a collectable, joke, surprise, character reaction, or visible milestone every 15–25 seconds.

5. **Compact but replayable**  
   A small set of high-quality art supports multiple missions through systematic remixing.

## 3. Player fantasy and tone

The player is a clever, mischievous cat recovering stolen treats. They are not a violent thief or warrior. Guards are embarrassed, startled, or temporarily put to sleep; they are never injured.

The tone is:

- Playfully spooky rather than frightening.
- Mischievous rather than aggressive.
- Warm, silly, and encouraging.
- Clear enough for independent play.

The story should consistently frame treasure collection as recovering the town's stolen treats.

## 4. Target experience

During the first minute, the player should:

1. Begin moving within 10 seconds.
2. Collect a treat on safe ground.
3. Learn to jump with no serious failure consequence.
4. Discover that pouncing creates funny reactions and opens secrets.
5. Reach a celebrated checkpoint.

During a normal level, the player should:

- Always understand the primary goal.
- See the next useful destination or landmark.
- Recover immediately after a mistake.
- Finish even if optional treasures are missed.
- Leave with at least one visible reward.

## 5. Core game loop

1. Select a level from the Chapter Map.
2. Follow environmental cues toward the exit.
3. Move, jump, and pounce through obstacles.
4. Recover required treats and optional treasures.
5. Outwit guards or avoid their flashlight cones.
6. Discover a secret or complete an optional challenge.
7. Reach the exit and receive paw badges.
8. Replay for missing badges or continue to the next level.

### Moment-to-moment rhythm

Each level alternates between:

- **Safe exploration:** read the route and spot treasure.
- **Action:** perform a jump, pounce, chase, or stealth crossing.
- **Reward:** collect an item, activate a checkpoint, or trigger a joke.
- **Breather:** land in a safe space and preview the next challenge.

Avoid placing more than two demanding actions in sequence without a safe landing area.

## 6. Controls

### Keyboard

| Action | Input |
|---|---|
| Move | A/D or Left/Right arrows |
| Jump | W, Up arrow, or Space |
| Pounce | Shift or K |
| Pause | Escape |

### Touch

| Action | Input |
|---|---|
| Move | Horizontal thumb joystick |
| Jump | Large Jump button |
| Pounce | Large Pounce button |
| Pause | Pause button in the HUD |

Double-tapping Jump may remain as an optional pounce shortcut, but it is never the only way to pounce.

### Movement principles

- Preserve acceleration, variable jump height, coyote time, and jump buffering.
- Prioritize predictable landings over momentum mastery.
- Keep the main route completable without advanced pounce movement.
- Use pounce for shortcuts, secrets, guard interactions, and recovery.
- Prevent accidental input during transitions and after losing focus.

## 7. Campaign structure

Chapter One divides the existing world into six short levels. Levels may share world geometry, but each has a distinct goal, pacing pattern, treasure layout, and enemy rule.

### Level 1: First Steps

**Location:** Opening cemetery  
**Purpose:** Contextual tutorial  
**Target length:** 2–3 minutes

The player follows a trail of treats through a safe version of the opening area.

Introduced in order:

1. Move toward a visible candy.
2. Jump onto a low platform.
3. Jump across a forgiving gap.
4. Pounce through a marked pumpkin cache.
5. Reach the cemetery gate checkpoint.

No moving enemies appear before the player has practised all three actions. Falling returns the cat to the most recent safe platform.

**Primary goal:** Reach the cemetery gate.  
**Secret:** Open the tutorial pumpkin cache.  
**Optional challenge:** Collect every treat.

### Level 2: Treat Trail

**Location:** Cemetery route  
**Purpose:** Reinforce traversal and route reading  
**Target length:** 3–4 minutes

Treasure forms a readable trail across ground and platforms. The first spike hazard is clearly previewed and preceded by a checkpoint.

**Primary goal:** Recover five treats and reach the courtyard.  
**Secret:** Find a treat behind a scenery landmark.  
**Optional challenge:** Finish without touching a hazard.

### Level 3: Guard Trouble

**Location:** Cemetery gate and early courtyard  
**Purpose:** Introduce playful stealth and guard interactions  
**Target length:** 3–5 minutes

Raccoon flashlight cones become functional. Entering a cone fills a short, visible suspicion meter. The player can leave the cone, jump over the guard, or pounce to put the guard into a temporary slapstick stun.

**Primary goal:** Pass three guard posts.  
**Secret:** Pounce a suspicious pumpkin near a guard route.  
**Optional challenge:** Finish without being fully spotted.

### Level 4: Pumpkin Secrets

**Location:** Main courtyard  
**Purpose:** Encourage exploration and environmental interaction  
**Target length:** 4–5 minutes

The player searches several possible routes for a hidden snack cache. Lamps, treasure glows, and ghost hints direct attention without revealing the complete solution.

**Primary goal:** Find the cache and recover the moon medallion.  
**Secret:** Locate all three bonus cache treasures.  
**Optional challenge:** Bamboozle every raccoon.

### Level 5: Rooftop Rescue

**Location:** Manor roofs  
**Purpose:** Combine movement mastery with the ghost unlock  
**Target length:** 4–6 minutes

Bats create moving timing obstacles. The player follows a treasure trail to free the tiny ghost. Once rescued, the ghost demonstrates its hint ability immediately.

**Primary goal:** Rescue the ghost and reach the vault wing.  
**Secret:** Find a moon treasure on the high route.  
**Optional challenge:** Complete the rooftop route without a rescue.

### Level 6: The Moon Vault

**Location:** Vault wing  
**Purpose:** Celebratory finale combining learned mechanics  
**Target length:** 5–6 minutes

The player gathers the final required treasures, passes a compact sequence of guards and hazards, and opens the vault. The finale is an escape sequence with generous checkpoints, strong visual direction, and no new control mechanic.

**Primary goal:** Open the vault and escape.  
**Secret:** Recover the final moon medallion.  
**Optional challenge:** Escape with all available treasures.

## 8. Goals and treasure

### Required treasure

The campaign objective is based on a clearly communicated required amount. The HUD displays:

> Treats for the vault: 0 / 10

Required treats are placed on readable main routes. A player should not need to backtrack across an entire level to finish.

### Optional treasure

Additional treasures count toward completion and paw badges but do not block progression. They may appear on:

- Higher platform routes.
- Short pounce shortcuts.
- Routes guarded by flashlight cones.
- Hidden pumpkin caches.
- Small detours visible from the main route.

### Collection feedback

Every collection triggers:

- A readable burst and brief item enlargement.
- A rising musical note.
- Immediate HUD progress.
- A subtle cat or ghost reaction.

Milestones at one, five, seven, and ten required treats receive stronger feedback.

## 9. Checkpoints, health, and failure

### Default Adventure mode

- Checkpoints activate automatically at safe landmarks.
- A hazard or enemy capture returns the cat to the latest checkpoint.
- Collected treasure remains collected.
- There is no campaign-ending loss condition.
- Recovery takes no more than two seconds.

Hearts represent protection during the current checkpoint section. A mistake removes one heart; reaching the next checkpoint restores hearts. Losing all hearts triggers the same checkpoint rescue with a humorous message, not a level reset.

### Cozy assist

After repeated failure at the same challenge, the ghost offers help automatically:

- Add a temporary safe platform.
- Slow the nearest guard.
- Reduce a flashlight cone.
- Provide a stronger route arrow.
- Grant one temporary hit of protection.

Help is framed as teamwork, never as lowering difficulty. It does not prevent badges unless a future challenge mode explicitly says so.

### Optional Challenge mode

Challenge mode may use limited hearts, stricter checkpoints, and time targets. It is outside the Chapter One launch requirement and must not affect the default experience.

## 10. Enemies and hazards

### Raccoon guard

The existing raccoon sprite supports several behavioural roles:

| Role | Behaviour |
|---|---|
| Sleepy guard | Slow patrol and short flashlight cone |
| Lookout | Stationary with a sweeping flashlight |
| Nervous guard | Turns frequently but has a short suspicion timer |
| Fast guard | Faster patrol used late in the campaign |
| Patrol captain | Longer route and stronger telegraphing; no new artwork required |

When pounced, guards enter a funny stunned state before resuming patrol. They cannot be permanently removed.

### Bat

The existing bat supports:

- Fixed looping flight.
- Activation when the player approaches.
- Brief pursuit followed by a return home.
- Treasure-carrying routes.

Bats must cast a visible shadow or flight cue before crossing the player's path.

### Hazards

Spikes, gaps, and moving obstacles must be readable against the background. The player should see a hazard before committing to a jump.

Hazard rules:

- No surprise damage from off-screen objects.
- No mandatory blind jumps.
- Safe ground after each major challenge.
- Early hazards have wide recovery margins.
- Repeated failure activates Cozy assist.

## 11. Light stealth system

Flashlight cones are functional gameplay objects.

When the cat enters a cone:

1. The cone brightens.
2. A suspicion indicator begins filling over approximately one second.
3. The guard reacts visually and audibly.
4. Leaving the cone drains suspicion quickly.
5. A full indicator triggers checkpoint rescue.

This delay lets children understand cause and effect and correct a mistake. Touching a guard without pouncing also triggers rescue.

Stealth is never required for basic completion until after its dedicated introduction. Later levels can offer stealth as an optional paw-badge condition.

## 12. Ghost companion

The ghost is rescued in Level 5 and remains available afterward.

### Core functions

- Floats toward nearby optional treasure when the player pauses.
- Indicates the general direction of the level exit after inactivity.
- Delivers contextual Cozy-assist help.
- Celebrates collections, checkpoints, and level completion.

The ghost acts automatically and requires no additional control button.

## 13. Progression and rewards

### Paw badges

Each level awards up to three badges:

1. **Adventure paw:** Complete the primary goal.
2. **Secret paw:** Find the level secret.
3. **Challenge paw:** Complete the optional challenge.

The Adventure paw unlocks the next level. Other paws are optional.

### Chapter Map

The initial meta-game is a lightweight menu built from existing UI, background, landmark, cat, ghost, and loot assets. It includes:

- Six level nodes.
- Collected paw badges.
- Total treasure progress.
- A Continue button.
- Level replay.
- Settings.

No separate illustrated hub environment is required.

### Persistent progress

Save locally:

- Highest unlocked level.
- Paw badges per level.
- Secrets discovered.
- Best treasure total.
- Best completion time where applicable.
- Sound, motion, and accessibility settings.

Progress is stored on the device and never transmitted.

## 14. Interface and onboarding

### Title screen

The title screen prioritizes one large **Play** button. Story copy is short, with detailed controls available behind a Help button rather than presented as required reading.

### HUD

The gameplay HUD contains:

- Required treasure: `0 / 10`.
- Current objective in child-friendly language.
- Hearts.
- Pause button.

Optional total treasure should not visually compete with the required goal.

### Contextual prompts

Prompts appear next to the relevant action and disappear after success:

- “Follow the candy!”
- “Jump up!”
- “Pounce through!”

Prompts use an icon plus a short phrase. Avoid sarcasm when it communicates a required mechanic; jokes can follow the successful action.

### End-of-level screen

Show:

- Primary goal completion.
- Earned paw badges.
- Found and missing secrets.
- Treasure recovered.
- Continue and Replay buttons.

Never label a completed level as a poor performance.

## 15. Art direction and asset budget

### Existing visual set

Chapter One is built from:

- Cat animation sheets.
- Raccoon guard sprite.
- Bat and ghost atlas.
- Candy, coin, gem, and moon treasure atlas.
- Cemetery and manor background.
- Cobblestone body texture and platform-edge sprites.
- Trees, pines, pumpkins, gravestones, lamps, signs, spikes, and vault assets.

### Art rules

- No new background panoramas.
- No new playable-character animation sheets.
- No new enemy species.
- No new environment theme.
- No feature may depend on bespoke art before it can be playtested.
- Prefer transform, timing, lighting, particles, palette overlays, and behaviour changes.
- Preserve clear silhouettes and collision readability.

Canvas and CSS may provide:

- Lighting and fog overlays.
- Lamp colour changes.
- Camera emphasis and screen shake.
- Sprite tinting for feedback, not permanent character variants.
- Particles, route arrows, suspicion indicators, and badge UI.

If one future art addition is approved, it should be a high-leverage modular atlas with several reusable props or effects.

## 16. Audio direction

Chapter One can use generated or synthesized audio without additional visual assets.

Required categories:

- Jump and pounce cues.
- Treasure collection notes that rise with short streaks.
- Guard suspicion and detection cues.
- Checkpoint flourish.
- Ghost unlock theme.
- Level completion chord.
- Quiet looping ambience or simple music layer.

Audio must reinforce state changes. Suspicion, damage, collection, and success should be distinguishable without looking at the HUD.

Music and effects have separate volume controls. The game remains fully playable when muted.

## 17. Accessibility and child safety

- Reduced-motion option.
- High-contrast hazard and flashlight indicators.
- Large touch targets separated from screen edges and safe areas.
- No essential information communicated by colour alone.
- Short text supported by icons and animation.
- Pause at any time without losing progress.
- No advertisements, purchases, chat, accounts, external links, or data collection.
- Avoid frightening failure imagery, loud jumpscares, and punishment language.
- Support keyboard and touch throughout every menu.

## 18. Technical design constraints

- Remain a no-build, dependency-free Canvas 2D web game.
- Preserve the fixed 1280×720 internal playfield and responsive presentation.
- Maintain deterministic collision geometry independently from visual sprites.
- Continue supporting offline installation through the service worker.
- Define each level through data: bounds, spawn, exit, checkpoints, treasure, enemies, hazards, goal, and badge conditions.
- Avoid duplicating the entire world runtime for each level.
- Keep art fallbacks where asset loading can fail.

### Suggested level data shape

Each level definition should contain:

- `id` and display name.
- World start and end coordinates.
- Player spawn and exit target.
- Active checkpoints.
- Treasure placements and required count.
- Enemy placements and behaviour roles.
- Active hazards.
- Tutorial steps.
- Primary goal and badge conditions.
- Lighting or palette parameters.

## 19. Scope

### Chapter One launch scope

- Six playable levels using the existing world and art.
- Contextual tutorial.
- Functional flashlight detection.
- Dedicated touch pounce button.
- Checkpoint rescue and Cozy assist.
- Required-versus-optional treasure clarity.
- Ghost hint functionality.
- Paw badges and Chapter Map.
- Local progress saving.
- Pause and accessibility settings.
- Improved collection, checkpoint, and completion feedback.

### Explicit non-goals

- Additional worlds or background sets.
- New playable characters.
- New enemy art.
- Combat bosses.
- Online accounts, leaderboards, or multiplayer.
- Monetization or live-service content.
- Large inventory or dialogue systems.
- Complex ability trees.

## 20. Production sequence

### Milestone 1: Kid-friendly core

- Clarify the `0 / 10` goal.
- Add the dedicated Pounce button.
- Add the early checkpoint.
- Replace full game-over with checkpoint rescue.
- Build the contextual tutorial.

**Exit criterion:** A new player can reach the first checkpoint without verbal instruction.

### Milestone 2: Level framework

- Move placements and rules into level data.
- Add level starts, exits, transitions, and completion states.
- Split the world into six missions.
- Add Chapter Map and local saving.

**Exit criterion:** All six levels can be selected, completed, and replayed independently.

### Milestone 3: Variety and feedback

- Implement flashlight suspicion.
- Add guard behaviour roles.
- Add ghost hints and Cozy assist.
- Improve collection and checkpoint celebration.

**Exit criterion:** Each level has a distinct play pattern without requiring new artwork.

### Milestone 4: Rewards and polish

- Add paw badges and secrets tracking.
- Add pause and accessibility settings.
- Complete audio and end-of-level presentation.
- Tune difficulty through child playtesting.

**Exit criterion:** Children understand the goals, recover from mistakes, and voluntarily replay for at least one optional reward.

## 21. Playtesting plan

Test with 5–8 children from the intended age range per major iteration. Observe before offering help.

Measure:

- Time until first movement.
- Whether the first treasure is collected without prompting.
- Where help is requested.
- Failures per obstacle.
- Misunderstood controls or HUD elements.
- First-level completion rate.
- Full-chapter completion rate.
- Voluntary replay and secret-search behaviour.

### Target outcomes

- 80% begin moving within 10 seconds.
- 75% reach the first checkpoint without adult help.
- 90% understand how many treats open the vault.
- No mistake removes more than 20 seconds of progress.
- No child fails the same obstacle more than twice without assistance appearing.
- At least 50% voluntarily replay a level or pursue an optional badge.

## 22. Open design decisions

These decisions should be resolved through prototypes and playtesting:

1. Whether levels use fixed required-treasure counts or a shared campaign total.
2. Whether hearts remain visible in the default mode once game-over is removed.
3. The ideal flashlight suspicion duration for different ages.
4. Whether level timers motivate players or create unnecessary pressure.
5. How directly the ghost should reveal secrets.
6. Whether Challenge mode is valuable enough for the initial release.

Until testing answers these questions, choose the more forgiving and understandable option.
