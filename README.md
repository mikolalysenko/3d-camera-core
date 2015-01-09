**WORK IN PROGRESS**

3d-camera-core
==============
A common interface for 3D cameras.  This module is a caching layer for maintaining coordinate system transformations and computing camera properties like frustum planes or axes from constituent matrices.

This modules is an internal base interface.  Actual camera controllers should use this module internally to expose a camera interface.

## Example

```javascript
```

### With glslify

```javascript
```

## Install

```
```

## API

The overall goal of this module is to keep track of conversions between a number of different coordinate systems.  Because multiplying and recalculating these conversions is expensive, this module caches this data for future use

### Coordinate system conversions

#### `coords.toClip`

#### `coords.toView`

#### `coords.toWorld`

#### `coords.toData`


### Frustum

#### `coords.frustum.planes`

#### `coords.frustum.vertices`


### Position and orientation

#### `coords.position`

#### `coords.up`

#### `coords.down`

#### `coords.left`

#### `coords.right`

#### `coords.forward`

#### `coords.back`

# Legal

(c) 2015 Mikola Lysenko.  MIT License