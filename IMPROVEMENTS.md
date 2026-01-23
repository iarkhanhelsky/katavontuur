# Tile Matching Improvements

## Recent Enhancements

### Shape-Based Edge Detection

The tile matching system has been enhanced to detect edge shapes, not just colors:

1. **Edge Shape Analysis**
   - Samples pixels perpendicular to each edge to detect shape
   - Classifies edges as: `smooth`, `rough`, or `jagged`
   - Calculates roughness metric (variation in edge position)

2. **Improved Compatibility Rules**
   - **Shape matching is now 50% of compatibility score** (most important)
   - Jagged edges only connect to jagged edges
   - Smooth edges connect to smooth edges
   - Rough edges can connect to either (flexible)

3. **Enhanced Sampling**
   - Increased edge sampling from 15 to 30 pixels per edge
   - Added perpendicular profile sampling (5 pixels deep)
   - Better detection of edge irregularities

4. **Stricter Threshold**
   - Increased compatibility threshold from 0.3 to 0.4
   - Reduces false matches while maintaining flexibility

## What This Fixes

- **Jagged-to-flat mismatches**: Jagged edges no longer connect to flat edges
- **Color-only matching**: Now considers shape, not just color
- **Visual seams**: Better edge alignment reduces visible seams
- **Texture continuity**: Similar textures connect better

## Next Steps

1. **Regenerate the compatibility matrix**:
   - Open `generate-matrix.html`
   - Generate new matrix with shape detection
   - Save as `assets/tile-compatibility-matrix.json`

2. **Test and adjust**:
   - Run the game and observe tile connections
   - If matching is too strict, lower threshold (0.35)
   - If matching is too loose, raise threshold (0.45)

3. **Manual overrides** (if needed):
   - Use `tileConfig.setCompatibilityOverride()` for specific cases
   - Override edge types for tiles that need special handling

## Technical Details

### Edge Shape Detection Algorithm

1. For each point along the edge, sample pixels perpendicular to the edge
2. Find the first non-transparent pixel (edge position)
3. Calculate standard deviation of edge positions → roughness
4. Classify:
   - Roughness < 0.5 → smooth/flat
   - Roughness 0.5-1.5 → rough/textured
   - Roughness > 1.5 → jagged/irregular

### Compatibility Scoring

```
Final Score = (Shape Match × 0.5) + (Color Similarity × 0.3) + 
              (Dominant Color Match × 0.1) + (Roughness Match × 0.1)
```

Shape match is binary:
- Same shape type → 1.0
- Both smooth/rough → 0.8
- Jagged vs smooth → 0.2 (rejected)
- Other combinations → 0.6
