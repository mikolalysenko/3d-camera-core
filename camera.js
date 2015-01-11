module.exports = createCamera

var multiply      = require('gl-mat4/multiply')
var invert        = require('gl-mat4/invert')
var identity      = require('gl-mat4/identity')

var dup           = require('dup')

var MODEL         = 'model'
var VIEW          = 'view'
var PROJECTION    = 'projection'

var DATA          = 'data'
var WORLD         = 'world'
var CLIP          = 'clip'

var LEFT          = 'left'
var RIGHT         = 'right'
var UP            = 'up'
var DOWN          = 'down'
var FORWARD       = 'forward'
var BACKWARD      = 'backward'

var POSITION      = 'position'

var COORD_SYSTEMS = [ DATA,       WORLD,       VIEW,            CLIP ]
var MATRICES      = [       MODEL,       VIEW,       PROJECTION      ]
var AXES          = [ LEFT, RIGHT, UP, DOWN, FORWARD, BACKWARD ]

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function makeIdentity() {
  var storage = dup(16)
  return function() {
    return storage
  }
}

function makeTransform(propName, dependencies, accessors, dirty) {
  var storage = dup(16)
  var lastAccess = 0
  var numDeps = dependencies.length
  return function() {
    var d = 0
    for(var i=0; i<numDeps; ++i) {
      d = Math.max(d, dirty[dependencies[i]])
    }
    if(lastAccess < d) {
      lastAccess = d
      multiply(storage, accessors[0](), accessors[1])
      for(var i=2; i<accessors.length; ++i) {
        multiply(storage, storage, accessors[i]())
      }
    }
    return storage
  }
}

function makePosition(n, transform, deps, dirty) {
  var storage = dup(3)
  var lastAccess = 0
  return function() {
    var d = 0
    for(var i=0; i<deps.length; ++i) {
      d = Math.max(d, dirty[deps[i]])
    }
    if(lastAccess < d) {
      var mat = transform()
      var w = mat[15]
      storage[0] = mat[12] / w
      storage[1] = mat[13] / w
      storage[2] = mat[14] / w
      lastAccess = d
    }
    return storage
  }
}

function makeAxis(d, s, transform, deps, dirty) {
  var storage = dup(3)
  var lastAccess = 0
  return function() {
    var d = 0
    for(var i=0; i<deps.length; ++i) {
      d = Math.max(d, dirty[deps[i]])
    }
    if(lastAccess < d) {
      lastAccess = d
      var mat = transform()
      storage[0] = s * mat[4*d]
      storage[1] = s * mat[4*d+1]
      storage[2] = s * mat[4*d+2]
    }
    return storage
  }
}

function makeFrustum(transform, invTransform, deps, dirty) {
  var lastAccessPlanes    = 0
  var planes              = dup([6,4])
  var lastAccessVertices  = 0
  var vertices            = dup([8,3])
  
  function recomputePlanes() {
    var d = 0
    for(var i=0; i<deps.length; ++i) {
      d = Math.max(d, dirty[deps[i]])
    }
    if(lastAccessPlanes >= d) {
      return
    }
    var M = transform()

    var p0 = planes[0]
    p0[0] = M[12] + M[0]
    p0[1] = M[13] + M[1]
    p0[2] = M[14] + M[2]
    p0[3] = M[15] + M[3]

    var p1 = planes[1]
    p1[0] = M[12] - M[0]
    p1[1] = M[13] - M[1]
    p1[2] = M[14] - M[2]
    p1[3] = M[15] - M[3]

    var p2 = planes[2]
    p2[0] = M[12] + M[4]
    p2[1] = M[13] + M[5]
    p2[2] = M[14] + M[6]
    p2[3] = M[15] + M[7]

    var p3 = planes[3]
    p3[0] = M[12] - M[4]
    p3[1] = M[13] - M[5]
    p3[2] = M[14] - M[6]
    p3[3] = M[15] - M[7]

    var p4 = planes[4]
    p4[0] = M[8]
    p4[1] = M[9]
    p4[2] = M[10]
    p4[3] = M[11]

    var p5 = planes[5]
    p5[0] = M[12] - M[8]
    p5[1] = M[13] - M[9]
    p5[2] = M[14] - M[10]
    p5[3] = M[15] - M[11]
  }

  function recomputeVertices() {
    var d = 0
    for(var i=0; i<deps.length; ++i) {
      d = Math.max(d, dirty[deps[i]])
    }
    if(lastAccessVertices >= d) {
      return
    }
    var M = invTransform()

    var w = M[12] + M[13] + M[14] + M[15]

    var v0 = vertices[0]
    var v1 = vertices[1]
    var v2 = vertices[2]
    var v3 = vertices[3]
    var v4 = vertices[4]
    var v5 = vertices[5]
    var v6 = vertices[6]
    var v7 = vertices[7]
  }

  var result = {}
  Object.defineProperties(result, {
    planes: {
      get: function() {
        recomputePlanes()
        return planes
      },
      enumerable: true,
      configurable: true
    },
    vertices: {
      get: function() {
        recomputeVertices()
        return vertices
      },
      enumerable: true,
      configurable: true
    }
  })
  return result
}

function createFrame(getTransform, getPosition, getAxis, frustum) {
  var result = {
    frustum: frustum
  }

  COORD_SYSTEMS.forEach(function(coords, i) {
    Object.defineProperty(result, 'to' + capitalizeFirst(coords), {
      get: getTransform[i],
      enumerable: true,
      configurable: true
    })
  })

  Object.defineProperty(result, POSITION, {
    get: getPosition,
    enumerable: true,
    configurable: true
  })

  AXES.forEach(function(axis, i) {
    Object.defineProperty(result, axis, {
      get: getAxis
    })
  })
}

function dummyController(matrix) {
  identity(matrix)
}

function createCamera(controller) {
  var result     = {}
  var dirty      = {}
  var counter    = 1

  function setDirty(propName) {
    dirty[propName] = ++counter
  }

  var getForward = MATRICES.map(function(m) {
    var getData = controller[m] || dummyController
    var matrix = dup(16)
    var lastAccess = 0
    dirty[m] = ++counter
    return function() {
      var d = dirty[m]
      if(lastAccess < d) {
        lastAccess = d
        getData(matrix)
      }
      return matrix
    }
  })

  var getInverse = MATRICES.map(function(m) {
    var matrix = dup(16)
    var lastAccess = 0
    return function() {
      var d = dirty[m]
      if(lastAccess < d) {
        lastAccess = d
        invert(matrix, getForward(d))
      }
      return matrix
    }
  })

  var getTransform = COORD_SYSTEMS.map(function(src, i) {
    return COORD_SYSTEMS.map(function(dst, j) {
      var propName = src + 'to' + dst
      if(i+1 === j) {
        return getForward[i]
      } else if(j+1 === i) {
        return getInverse[j]
      } else if(i < j) {
        return makeTransform(
          propName, 
          MATRICES.slice(i,j),
          getForward.slice(i,j),
          dirty)
      } else if(i > j) {
        return makeTransform(
          propName, 
          MATRICES.slice(j,i),
          getInverse.slice(j,i).reverse(),
          dirty)
      } else {
        return makeIdentity()
      }
    })
  })

  var getPosition = COORD_SYSTEMS.map(function(src, n) {
    return makePosition(n,
      getTransform[0][n],
      MATRICES.slice(0, n),
      dirty)
  })

  var getAxis = COORD_SYSTEMS.map(function(src, n) {
    return AXES.map(function(axis, m) {
      return makeAxis(
        m>>>1, 
        (m & 1) ? -1 : 1, 
        getTransform[0][n], 
        MATRICES.slice(0, n), 
        dirty)
    })
  })

  var frustum = COORD_SYSTEMS.map(function(src, n) {
    return makeFrustum(
      getTransform[n][0],
      getTransform[0][n],
      MATRICES.slice(0, n),
      dirty)
  })

  COORD_SYSTEMS.forEach(function(src, i) {
    result[src] = createFrame(
      getTransform[i],
      getPosition[i],
      getAxis[i],
      frustum[i])
  })

  //Return the resulting camera object
  return {
    setDirty: setDirty,
    camera: result
  }
}