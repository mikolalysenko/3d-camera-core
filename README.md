**WORK IN PROGRESS**

camera-3d
=========
A common interface for 3D cameras.  This module is a caching layer for maintaining coordinate system transformations and computing camera properties like frustum planes or axes from constituent matrices. This modules is an internal base interface.  Actual camera controllers should use this module internally to expose a camera interface.

### Notes on coordinates

By convention, we will define 4 different 3 dimensional projective homogeneous coordinate systems:

* **Data coordinates**: Which are the coordinates used by models and 3D data
* **World coordinates**: Which is a common coordinate system for all objects within the scene
* **View coordinates**: Which is the coordinate system of the 
* **Clip coordinates**: The device clip coordinate system

These coordinates are related by a set of three matrices:

* **Model matrix**: Maps data coordinates to world coordinates
* **View matrix**: Maps world coordinates to view coordinates
* **Projection matrix**: Maps view coordinates to device clip coordinates

The goal of this module is to maintain the relationships between these coordinate systems as matrices and to define a standard interface for renderable objects which need to consume camera information.

## Example

### Basic usage

```javascript
```

### With glslify

This module directly exposes a glslify-compatible interface.  You can assign the camera to a uniform variable

```glsl
#pragma glslify: Camera = require(camera-3d)

attribute vec3 position, normal;

uniform Camera camera;

varying vec3 fragNormal, fragView;

void main() {
  //Compute the position in clip coordinates
  gl_Position = camera.data.toClip * vec4(position, 1);

  //Compute position/orientation in world coordinates
  vec4 worldPosition = camera.data.toWorld * vec4(position, 1);
  vec3 worldNormal   = (vec4(normal, 0) * camera.world.toData).xyz;
  vec3 worldView     = worldPosition - camera.world.position;

  //Compute fragment values
  fragNormal = normalize(worldNormal);
  fragView   = normalize(worldView);
}
```

### Creating a camera

For users who wish to expose this module

```javascript
```

## Install

```
npm install 3d-camera-core
```

## API

The overall goal of this module is to keep track of conversions between a number of different coordinate systems.  Because multiplying and recalculating these conversions is expensive, this module caches this data for future use.  After a camera object has been created, no further memory allocations are performed.

### Coordinate system conversions

#### `coords.toClip`

#### `coords.toView`

#### `coords.toWorld`

#### `coords.toData`


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