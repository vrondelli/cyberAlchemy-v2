extends Node3D
## Decorative presentation only. Questions: ../../OPEN-QUESTIONS.md.

const SURFACE = preload("res://presentation/ground.gdshader")
const CONTACT = preload("res://presentation/contact.gdshader")
var rng := RandomNumberGenerator.new()
var materials: Dictionary = {}
var palette := {"porcelain": "c9c1ac", "amber": "bd914f", "teal": "568983",
	"moss": "8d9b70", "coral": "c18b78", "lavender": "a59ab3", "steel": "596967",
	"dark": "243639", "rubber": "333c3b", "eye": "b0ded7"}

func _init() -> void:
	rng.seed = 260906

func material(color: Color, textured := false) -> Material:
	var key := color.to_html() + str(textured)
	if materials.has(key):
		return materials[key]
	var result: Material
	if textured:
		var shader := ShaderMaterial.new()
		shader.shader = SURFACE
		shader.set_shader_parameter("tint", color)
		result = shader
	else:
		var standard := StandardMaterial3D.new()
		standard.albedo_color = color
		standard.roughness = 0.86
		standard.metallic_specular = 0.22
		result = standard
	materials[key] = result
	return result

func mesh_at(mesh: Mesh, at: Vector3, color: Color, textured := false) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material(color, textured)
	instance.position = at
	add_child(instance)
	return instance

func box(at: Vector3, size: Vector3, color: Color, textured := false) -> MeshInstance3D:
	var shape := BoxMesh.new()
	shape.size = size
	return mesh_at(shape, at, color, textured)

func cylinder(at: Vector3, radius: float, height: float, color: Color) -> MeshInstance3D:
	var shape := CylinderMesh.new()
	shape.top_radius = radius
	shape.bottom_radius = radius
	shape.height = height
	shape.radial_segments = 16
	return mesh_at(shape, at, color)

func segment(a: Vector3, b: Vector3, radius: float, color: Color) -> void:
	var node := cylinder((a+b)*0.5, radius, a.distance_to(b), color)
	var direction := (b-a).normalized()
	node.quaternion = Quaternion(Vector3.UP, direction)

func contact(at: Vector3, size: Vector2, opacity := 0.22) -> Node3D:
	var shape := PlaneMesh.new()
	shape.size = size
	var node := MeshInstance3D.new()
	node.mesh = shape
	var shader := ShaderMaterial.new()
	shader.shader = CONTACT
	shader.set_shader_parameter("opacity", opacity)
	node.material_override = shader
	node.position = at + Vector3(0, 0.008, 0)
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	return node

func asset(id: String, at: Vector3) -> Node3D:
	var scene := load("res://models/" + id + ".glb") as PackedScene
	var node := scene.instantiate() as Node3D
	add_child(node)
	node.position = at
	remap_materials(node)
	return node

func remap_materials(node: Node) -> void:
	if node is MeshInstance3D:
		for i in node.mesh.get_surface_count():
			var old: Material = node.mesh.surface_get_material(i)
			if old is StandardMaterial3D:
				var replacement := old.duplicate() as StandardMaterial3D
				var name: String = old.resource_name.to_lower()
				for key: String in palette:
					if name.begins_with(key):
						replacement.albedo_color = Color(palette[key])
						break
				replacement.roughness = 0.84
				replacement.metallic = minf(replacement.metallic, 0.18)
				replacement.metallic_specular = 0.24
				if name.begins_with("eye"):
					replacement.emission = Color("90c6c3")
					replacement.emission_energy_multiplier = 0.28
				node.set_surface_override_material(i, replacement)
	for child in node.get_children():
		remap_materials(child)

func polygon_mesh(points: Array[Vector3], color: Color, textured := true) -> void:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(0,points.size(),3):
		# Godot's front faces use clockwise winding.
		surface.add_vertex(points[i])
		surface.add_vertex(points[i+2])
		surface.add_vertex(points[i+1])
	surface.generate_normals()
	mesh_at(surface.commit(), Vector3.ZERO, color, textured)

func build() -> void:
	var ground := PlaneMesh.new()
	ground.size = Vector2(200, 200)
	var backdrop := mesh_at(ground, Vector3(0, -0.72, 0), Color("e3dfd3"))
	var backdrop_material := StandardMaterial3D.new()
	backdrop_material.albedo_color = Color("e3dfd3")
	backdrop_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	backdrop.material_override = backdrop_material
	contact(Vector3(0,-0.709,0),Vector2(14.0,9.5),0.24)
	var outline: Array[Vector2] = [Vector2(-5.5,-2.8),Vector2(-3.8,-3.8),Vector2(0,-3.9),
		Vector2(4.6,-3.4),Vector2(5.7,-2.0),Vector2(5.8,2.0),Vector2(4.0,3.25),
		Vector2(-0.5,3.55),Vector2(-4.5,3.0),Vector2(-5.8,1.0)]
	for i in outline.size():
		var a := Vector3(outline[i].x, -0.045, outline[i].y)
		var b := Vector3(outline[(i+1)%outline.size()].x, -0.045, outline[(i+1)%outline.size()].y)
		polygon_mesh([Vector3(0,-0.045,0),b,a], Color("b5a487"))
		var aa := a + Vector3(0.08,-0.56,0.06)
		var bb := b + Vector3(-0.05,-0.56,0.05)
		polygon_mesh([a,b,aa,b,bb,aa], Color("7d725d").lightened(rng.randf_range(0,0.12)))
		var count := int(a.distance_to(b) * 2.2)
		for j in count:
			var at := a.lerp(b, float(j)/maxi(count,1))
			rock(at + Vector3(0,-0.31,0), Vector3(rng.randf_range(0.22,0.42),0.27,rng.randf_range(0.2,0.4)), Color("8d8169"))
	# Worn stepping stones leave the replay's transport corridor legible.
	for i in 17:
		var x := -4.1 + float(i) * 0.51
		var slab := cylinder(Vector3(x,-0.028,rng.randf_range(-0.22,0.22)),0.28,0.04,Color("bfb197"))
		slab.scale.z = 0.63
		slab.rotation.y = rng.randf_range(-0.5,0.5)
	for i in 110:
		var x := rng.randf_range(-5.0,5.0)
		var z := rng.randf_range(-3.0,2.8)
		if absf(z) < 0.8 or (z < -0.7 and x > -1.0 and x < 4.2):
			continue
		grass(Vector3(x,-0.012,z))
		if i % 4 == 0:
			rock(Vector3(x,-0.015,z),Vector3(0.13,0.09,0.11),Color("a3977e"))
	# The resource field, workshop and exchange terminal retain their task roles.
	contact(Vector3(-3,0,-0.8),Vector2(2.9,2.3),0.35)
	asset("prop_resource_deposit",Vector3(-3,0,-0.85))
	for i in 5:
		crystal(Vector3(-4.05+rng.randf_range(-0.3,0.3),0,-1.8+rng.randf_range(-0.3,0.3)),rng.randf_range(0.4,1.05))
	contact(Vector3(3,0,-1.1),Vector2(3.6,3.0),0.36)
	asset("prop_workshop",Vector3(3,0,-1.1))
	workshop_details()
	contact(Vector3(0,0,-2.2),Vector2(1.9,1.65),0.28)
	asset("prop_market_terminal",Vector3(0,0,-2.2))
	asset("prop_charging_dock",Vector3(-3.95,0,1.75))
	contact(Vector3(-3.95,0,1.75),Vector2(2.1,1.9),0.21)
	# Maintenance rail, two lanterns and a small communications mast.
	for x in [1.65,4.5]:
		cylinder(Vector3(x,0.4,-2.5),0.045,0.8,Color("68716b"))
	segment(Vector3(1.65,0.7,-2.5),Vector3(4.5,0.7,-2.5),0.035,Color("68716b"))
	for at in [Vector3(-1.25,0,-2.6),Vector3(4.9,0,1.0)]:
		cylinder(at+Vector3(0,0.35,0),0.045,0.7,Color("59615a"))
		box(at+Vector3(0,0.7,0),Vector3(0.17,0.20,0.17),Color("d3b073"))
		box(at+Vector3(0,0.83,0),Vector3(0.22,0.04,0.22),Color("536363"))
	cylinder(Vector3(-2.0,0.75,-2.9),0.045,1.5,Color("667775"))
	var dish := cylinder(Vector3(-2.0,1.5,-2.9),0.22,0.055,Color("899d98"))
	dish.rotation_degrees.z = 60
	# Routed cables, grounded equipment and individual fasteners provide scale.
	for i in 12:
		var a := Vector3(-0.8+float(i)*0.23,0.025,-1.75+sin(float(i)*0.35)*0.12)
		var b := Vector3(-0.8+float(i+1)*0.23,0.025,-1.75+sin(float(i+1)*0.35)*0.12)
		segment(a,b,0.027,Color("59645c"))

func rock(at: Vector3, size: Vector3, color: Color) -> void:
	var shape := SphereMesh.new()
	shape.radius = 1
	shape.height = 2
	shape.radial_segments = 5
	shape.rings = 2
	var node := mesh_at(shape,at,color,true)
	node.scale = size
	node.rotation = Vector3(rng.randf_range(-0.2,0.2),rng.randf()*TAU,rng.randf_range(-0.2,0.2))

func grass(at: Vector3) -> void:
	for _blade in 4:
		var height := rng.randf_range(0.13,0.35)
		var tip := at + Vector3(rng.randf_range(-0.16,0.16),height,rng.randf_range(-0.16,0.16))
		var offset := Vector3(rng.randf_range(0.018,0.04),0,0)
		polygon_mesh([at-offset,at+offset,tip,at+offset,at-offset,tip],Color("7c8557").lightened(rng.randf()*0.15),false)

func crystal(at: Vector3, height: float) -> void:
	var shape := CylinderMesh.new()
	shape.top_radius = 0
	shape.bottom_radius = height * 0.22
	shape.height = height
	shape.radial_segments = 5
	var node := mesh_at(shape,at+Vector3(0,height*0.5,0),Color("b68155"))
	node.rotation.z = rng.randf_range(-0.2,0.2)

func workshop_details() -> void:
	box(Vector3(3,1.78,-1.05),Vector3(1.7,0.05,1.25),Color("67837b"))
	for x in [2.35,3.65]:
		box(Vector3(x,1.82,-1.05),Vector3(0.06,0.06,1.32),Color("4b5b54"))
		for z in [-1.55,-0.55]:
			cylinder(Vector3(x,1.86,z),0.035,0.022,Color("b9ae8d"))
	box(Vector3(4.05,0.53,-1.1),Vector3(0.35,0.74,0.75),Color("798273"))
	for i in 4:
		box(Vector3(4.24,0.38+i*0.09,-1.1),Vector3(0.025,0.022,0.46),Color("394d4c"))
	segment(Vector3(4.05,0.9,-1.5),Vector3(4.05,1.55,-1.5),0.06,Color("57645d"))
	box(Vector3(2.02,0.65,-0.35),Vector3(0.19,0.31,0.15),Color("475f5e"))
