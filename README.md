**WORK IN PROGRESS**

3d-camera-core
==============
A common interface for 3D cameras.  This module is a caching layer for maintaining coordinate system transformations and computing camera properties from a set of generating matrices. This module is intended to be used as a common interface and should not be required directly.

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

For most users of this module, you only need to worry about the stuff in this section.

## User example

```javascript
//You should call some other module to create a camera controller
var myCamera = createCameraType()

//Once you have a camera, then you can access the coordinate conversions directly
var dataToClip = myCamera.data.toClip

//You can also access the origin of the camera in any coordinate system too
var eyePosition = myCamera.world.origin
```

## User API

The overall goal of this module is to keep track of conversions between a number of different coordinate systems.  Because multiplying and recalculating these conversions is expensive, this module caches this data for future use.  After a camera object has been created, no further memory allocations are performed.

### Coordinate system conversions

The most basic function of this module is to provide a convenient syntax for getting whatever camera transformations you need.

#### `coords.toClip`
A 4x4 matrix representing the conversion from `coords` into clip coordinates.

#### `coords.toCamera`
A 4x4 matrix representing the conversion from `coords` into camera coordinates.

#### `coords.toWorld`
A 4x4 matrix representing the conversion from `coords` into world coordinates

#### `coords.toData`
A 4x4 matrix representing the conversion from `coords` into data coordinates.

### Origin

#### `coords.origin`

The position of the camera in the coordinate system.

# For implementors

A camera implementation should provide one or more "controllers" for each of the model, view and projection matrices.  Each controller is an object with two methods; one which tests if the controller has changed and one which reads out the state of the matrix for the controller.

## Implementation example

```javascript
var createCamera = require('3d-camera-core')

//A simple implementation of a camera controller
function simpleController() {
  var data = [1,0,0,0,
              0,1,0,0,
              0,0,1,0,
              0,0,0,1]
  var isDirty = false
  return {
    dirty: function() {
      return isDirty
    },
    get: function(m) {
      isDirty = false
      for(var i=0; i<16; ++i) {
        m[i] = data[i]
      }
    },
    set: function(m) {
      isDirty = true
      for(var i=0; i<16; ++i) {
        data[i] = m[i]
      }
    }
  }
}

//Create a set of controllers for the camera object
var controllers = {
  model: simpleController(),
  view: simpleController(),
  projection: simpleController()
}

//Return camera
var camera = createCamera(controllers)
```

## Implementor API

### Constructor

#### `var camera = createCamera(controllers)`

This creates a new camera object with the given controllers.  `controllers` is an object with the following properties:

* `controllers.model` a controller for the model matrix
* `controllers.view` a controller for view matrix
* `controllers.projection` a controller for the projection matrix

**Returns** A new camera object

### Controller interface

Each controller is an object which provides two methods:

#### `controller.dirty()`
This method should test if the state of the controller has changed since the last time `controller.get()` was called.  If it has, then the matrix value will be recomputed.

**Returns** `true` if the camera matrix has changed, otherwise `false`

#### `controller.get(matrix)`
This retrieves the state of the controller's matrix.  The result should be written into `matrix`

### Methods

#### `camera.setController(matrix, controller)`

Replaces the controller on the camera for `matrix` with `controller`.

* `matrix` is the name of the matrix, which is either `model`, `view` or `projection`
* `controller` is the new controller for the matrix

# Legal

(c) 2015 Mikola Lysenko.  MIT License