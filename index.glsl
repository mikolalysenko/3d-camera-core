struct CoordinateSystem {
  //Eye position
  vec3 position;

  //Coordinate system directions
  vec3 up, down, left, right, forward, back;

  //Coordinate transformations
  mat4 toClip, toView, toWorld, toData;
};

//A camera stores the relations between the various coordinate systems
struct Camera {
  CoordinateSystem clip, view, world, data;
};

#pragma glslify: export = Camera