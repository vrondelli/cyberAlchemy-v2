extends SceneTree
func _initialize() -> void:
 var model = load("res://models/robot_builder.glb").instantiate()
 var queue = [model]
 while not queue.is_empty():
  var node = queue.pop_front()
  if node is MeshInstance3D:
   var active = node.get_active_material(0)
   print(node.name, " mesh=",node.mesh.surface_get_material(0)," override=",node.get_surface_override_material(0)," name=",active.resource_name," color=",active.albedo_color)
  queue.append_array(node.get_children())
 model.free()
 quit()
