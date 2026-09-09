extends SceneTree
func _initialize() -> void:
 var surface=SurfaceTool.new()
 surface.begin(Mesh.PRIMITIVE_TRIANGLES)
 for v in [Vector3(0,0,0),Vector3(-3,0,-3),Vector3(-5,0,-2)]: surface.add_vertex(v)
 surface.generate_normals()
 print("Top triangle normals: ",surface.commit().surface_get_arrays(0)[Mesh.ARRAY_NORMAL])
 quit()
