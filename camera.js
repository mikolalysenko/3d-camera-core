module.exports = createCamera

var multiply      = require('gl-mat4/multiply')
var invert        = require('gl-mat4/invert')
var dup           = require('dup')

var MODEL         = 'model'
var VIEW          = 'view'
var PROJECTION    = 'projection'

var DATA          = 'data'
var WORLD         = 'world'
var CAMERA        = 'camera'
var CLIP          = 'clip'

var ORIGIN        = 'origin'

var COORD_SYSTEMS = [ DATA,       WORLD,       CAMERA,            CLIP ]
var MATRICES      = [       MODEL,       VIEW,         PROJECTION      ]

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function makeMatrix() {
  return [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
}

function makeVector() {
  return [0,0,0]
}

function makeDefaultController() {
  return {
    dirty: function() {
      return false
    },
    get: function(m) {
      for(var i=0; i<16; ++i) {
        m[i] = 0.0
      }
      for(var i=0; i<4; ++i) {
        m[i] = 1.0
      }
    }
  }
}

function createCamera(baseControllers) {
  var baseControllers = baseControllers || {}
  var controllers = {}
  var dirty = {}
  var storage = {}
  var counter = 1

  MATRICES.forEach(function(m) {
    controllers[m] = baseControllers[m] || makeDefaultController()
    storage[m] = makeMatrix()
    dirty[m] = ++counter
    controllers[m].get(storage[m])
  })

  function touch(m) {
    var c = controllers[m]
    var s = storage[m]
    if(c.dirty()) {
      c.get(s)
      return dirty[m] = ++counter
    } else {
      return dirty[m]
    }
  }

  function makeForwardSimple(propName) {
    return function() {
      touch(propName)
      return storage[propName]
    }
  }

  function makeForward(propName, dependencies) {
    var matrices = dependencies.map(function(m) {
      return storage[m]
    })
    var data = storage[propName] = makeMatrix()
    dirty[propName] = 0
    return function() {
      var d = 0
      for(var i=0; i<dependencies.length; ++i) {
        d = Math.max(d, touch(dependencies[i]))
      }
      if(dirty[propName] < d) {
        dirty[propName] = d
        multiply(data, matrices[1], matrices[0])
        for(var i=2; i<dependencies.length; ++i) {
          multiply(data, matrices[2], data)
        }
      }
      return data
    }
  }

  function makeInverseSimple(propName, dependency) {
    var data = storage[propName] = makeMatrix()
    dirty[propName] = 0
    return function() {
      var d = touch(dependency)
      if(dirty[propName] < d) {
        dirty[propName] = d
        invert(data, storage[dependency])
      }
      return data
    }
  }

  function makeInverse(propName, dependency, getDep) {
    var data = storage[propName] = makeMatrix()
    dirty[propName] = 0
    return function() {
      var dep = getDep()
      if(dirty[propName] < dirty[dependency]) {
        dirty[propName] = dirty[dependency]
        invert(data, dep)
      }
      return data
    }
  }

  function makeOrigin(propName, dependency, getDep) {
    var data = storage[propName] = makeVector()
    dirty[propName] = 0
    return function() {
      var dep = getDep()
      if(dirty[propName] < dirty[dependency]) {
        dirty[propName] = dirty[dependency]
        var w = dep[15]
        data[0] = dep[12] / w
        data[1] = dep[13] / w
        data[2] = dep[14] / w
      }
      return data
    }
  }

  function makeIdentity() {
    var data = makeMatrix(16)
    for(var i=0; i<16; ++i) {
      data[i] = 0
    }
    for(var i=0; i<4; ++i) {
      data[5*i] = 1
    }
    return function() {
      return data
    }
  }

  var transforms = dup([4,4], null)
  for(var i=0; i<4; ++i) {
    transforms[i][i] = makeIdentity()
    var deps = []
    for(var j=i+1; j<4; ++j) {
      deps.push(MATRICES[j-1])
      if(deps.length === 1) {
        transforms[i][j] = makeForwardSimple(deps[0])
      } else {
        transforms[i][j] = makeForward(
          COORD_SYSTEMS[i] + 'to' + COORD_SYSTEMS[j], 
          deps.slice())
      }
    }
  }

  for(var i=0; i<4; ++i) {
    for(var j=0; j<i; ++j) {
      if(j+1 === i) {
        transforms[i][j] = makeInverseSimple(
          COORD_SYSTEMS[i] + 'to' + COORD_SYSTEMS[j],
          MATRICES[j])
      } else {
        transforms[i][j] = makeInverse(
          COORD_SYSTEMS[i] + 'to' + COORD_SYSTEMS[j], 
          COORD_SYSTEMS[j] + 'to' + COORD_SYSTEMS[i],
          transforms[j][i])
      }
    }
  }

  function setController(matrix, controller) {
    if(!(matrix in controllers)) {
      return
    }
    controllers[matrix] = controller
    controller.get(storage[matrix])
    dirty[matrix] = ++counter
  }

  var camera = {
    setController: setController
  }

  for(var i=0; i<COORD_SYSTEMS.length; ++i) {
    var frame = {}
    Object.defineProperty(frame, ORIGIN, {
      get: makeOrigin(
              COORD_SYSTEMS[i] + 'origin', 
              CLIP + 'to' + COORD_SYSTEMS[i],
              transforms[3][i]),
      enumerable: true,
      configurable: true
    })
    for(var j=0; j<COORD_SYSTEMS.length; ++j) {
      Object.defineProperty(frame, 'to' + capitalizeFirst(COORD_SYSTEMS[j]), {
        get: transforms[i][j],
        enumerable: true,
        configurable: true
      })
    }
    camera[COORD_SYSTEMS[i]] = frame
  }

  return camera
}