struct Frustum {

  //Vertices of the frustum
  vec3 vertices[8];

  //Planes describing frustum
  vec4 planes[6];
};

struct CoordinateSystem {
  //Eye position
  vec3 position;

  //Coordinate system directions
  vec3 up, down, left, right, forward, back;

  //Camera frustum
  Frustum frustum;

  //Coordinate transformations
  mat4 toClip, toView, toWorld, toData;
};

//A camera stores the relations between the various coordinate systems
struct Camera {
  CoordinateSystem clip, view, world, data;
};

#pragma glslify: export = Camera