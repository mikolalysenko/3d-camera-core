'use strict'

var multiply = require('gl-mat4/multiply')
var invert = require('gl-mat4/invert')
var createCamera = require('../camera')
var tape = require('tape')

function simpleController() {
  var data = [1,0,0,0,
              0,1,0,0,
              0,0,1,0,
              0,0,0,1]
  var isDirty = false
  return {
    data: data,
    numCalls: 0,
    dirty: function() {
      return isDirty
    },
    get: function(m) {
      this.numCalls += 1
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

tape('camera controller', function(t) {
  var controllers = {
    model: simpleController(),
    view: simpleController(),
    projection: simpleController()
  }

  function checkMatrix(actual, expected, inverted, msg) {
    var m = [1,0,0,0,
             0,1,0,0,
             0,0,1,0,
             0,0,0,1]
    for(var i=0; i<expected.length; ++i) {
      multiply(m, controllers[expected[i]].data, m)
    }
    if(inverted) {
      invert(m, m)
    }
    t.equals([].slice.call(actual).join(), m.join(), msg)
  }

  t.equals(controllers.model.numCalls, 0)
  t.equals(controllers.view.numCalls, 0)
  t.equals(controllers.projection.numCalls, 0)

  var camera = createCamera(controllers)
  t.equals(controllers.model.numCalls, 1)
  t.equals(controllers.view.numCalls, 1)
  t.equals(controllers.projection.numCalls, 1)

  function fullCheck() {
    checkMatrix(camera.clip.toData, ['model', 'view', 'projection'], true, 'clip->data')
    checkMatrix(camera.clip.toWorld, ['view', 'projection'], true, 'clip->world')
    checkMatrix(camera.clip.toCamera, ['projection'], true, 'clip->camera')
    checkMatrix(camera.clip.toClip, [], false, 'clip->clip')

    checkMatrix(camera.camera.toData, ['model', 'view'], true, 'camera->data')
    checkMatrix(camera.camera.toWorld, ['view'], true, 'camera->world')
    checkMatrix(camera.camera.toCamera, [], false, 'camera->camera')
    checkMatrix(camera.camera.toClip, ['projection'], false, 'camera-clip')
 
    checkMatrix(camera.world.toData, ['model'], true, 'world->data')
    checkMatrix(camera.world.toWorld, [], false, 'world->world')
    checkMatrix(camera.world.toCamera, ['view'], false, 'world->camera')
    checkMatrix(camera.world.toClip, ['view', 'projection'], false, 'world->clip')

    checkMatrix(camera.data.toData, [], false, 'data->data')
    checkMatrix(camera.data.toWorld, ['model'], false, 'data->world')
    checkMatrix(camera.data.toCamera, ['model', 'view'], false, 'data->camera')
    checkMatrix(camera.data.toClip, ['model', 'view', 'projection'], false, 'data->clip')
  }

  fullCheck()
  t.equals(controllers.model.numCalls, 1)
  t.equals(controllers.view.numCalls, 1)
  t.equals(controllers.projection.numCalls, 1)

  controllers.view.set([
    2, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1])
  fullCheck()
  t.equals(controllers.model.numCalls, 1)
  t.equals(controllers.view.numCalls, 2)
  t.equals(controllers.projection.numCalls, 1)

  controllers.model.set([
    1, 0, 0, 0,
    0, 2, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1])
  fullCheck()
  t.equals(controllers.model.numCalls, 2)
  t.equals(controllers.view.numCalls, 2)
  t.equals(controllers.projection.numCalls, 1)
  
  controllers.projection.set([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 2, 0,
    0, 0, 0, 1])
  fullCheck()
  t.equals(controllers.model.numCalls, 2)
  t.equals(controllers.view.numCalls, 2)
  t.equals(controllers.projection.numCalls, 2)

  controllers.view.set([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 1, 1, 1])
  fullCheck()
  t.same(camera.world.origin, [-1,-1,-1])

  t.end()
})