**WORK IN PROGRESS**

3d-camera-core
==============
A common interface for 3D cameras.  This module is a caching layer for maintaining coordinate system transformations and computing camera properties like frustum planes or axes from constituent matrices. This modules is an internal base interface.  Actual camera controllers should use this module to expose a camera interface.

### Notes on coordinates

By convention, we will define 4 different 3 dimensional projective homogeneous coordinate systems:

* **Data coordinates**: The coordinates used by models and 3D data
* **World coordinates**: A common coordinate system for all objects within the scene
* **Camera coordinates**: The coordinate system in the world where the camera is at the center
* **Clip coordinates**: The device clip coordinate system

These coordinates are related by a set of three homogeneous 4x4 matrices:

* **Model matrix**: Maps data coordinates to world coordinates
* **View matrix**: Maps world coordinates to camera coordinates
* **Projection matrix**: Maps view coordinates to device clip coordinates

The goal of this module is to maintain the relationships between these coordinate systems as matrices and to define a standard interface for renderable objects which need to consume camera information.  Implementors should take this module and hook up whatever methods they want to compute the model/view/projection matrices, while users can then treat the resulting camera interface as a black box handling the various coordinate system conversions.

# User side

## User example

```javascript
//You should call some other module to create a camera controller
var myCamera = createCameraType()

//Once you have a camera, then you can access the coordinate conversions directly

```

## User API

The overall goal of this module is to keep track of conversions between a number of different coordinate systems.  Because multiplying and recalculating these conversions is expensive, this module caches this data for future use.  After a camera object has been created, no further memory allocations are performed.


### Coordinate system conversions

#### `coords.toClip`

#### `coords.toView`

#### `coords.toWorld`

#### `coords.toData`


### Origin and axes

#### `coords.origin`

#### `coords.up`

#### `coords.down`

#### `coords.left`

#### `coords.right`

#### `coords.front`

#### `coords.back`


### Frustum planes

#### `coords.frustum`


# For implementors

## Implementation example

```javascript
```

## Implementator API

### `var result = createCamera(controller)`

### `notify.model()`

### `notify.view()`

### `notify.projection()`


# Legal

(c) 2015 Mikola Lysenko.  MIT License