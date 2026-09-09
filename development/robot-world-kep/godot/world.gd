extends Node3D
## Replays recorded host states. This client does not decide world transitions.
## Open questions: ../OPEN-QUESTIONS.md.

var frames: Array = []
var index := 0
var elapsed := 0.0
var paused := false
var robots: Dictionary = {}
var constructions: Array[Node3D] = []
var status_label: Label
var agent_label: Label
var time_label: Label
var slider: HSlider
var capture_path := ""
var rendered_frames := 0

func _ready() -> void:
	var replay_path := "res://replay.json"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--replay="):
			replay_path = arg.trim_prefix("--replay=")
		if arg.begins_with("--capture="):
			capture_path = arg.trim_prefix("--capture=")
	var replay = JSON.parse_string(FileAccess.get_file_as_string(replay_path))
	if not replay is Dictionary or not replay.has("frames") or replay.frames.is_empty():
		push_error("Valid recorded world replay required: " + replay_path)
		get_tree().quit(1)
		return
	frames = replay.frames
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("111e28")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("d8e7ef")
	env.ambient_light_energy = 0.65
	environment.environment = env
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55, -30, 0)
	sun.light_energy = 0.9
	sun.shadow_enabled = true
	add_child(sun)
	box(Vector3(0, -0.20, 0), Vector3(11, 0.3, 6.5), Color("344751"))
	for x in range(-5, 6):
		box(Vector3(x, -0.042, 0), Vector3(0.012, 0.015, 6.0), Color("4a5c64"))
	for z in range(-3, 4):
		box(Vector3(0, -0.042, z), Vector3(10, 0.015, 0.012), Color("4a5c64"))
	asset("prop_resource_deposit", Vector3(-3, 0, -0.75))
	asset("prop_workshop", Vector3(3, 0, -1.05))
	asset("prop_market_terminal", Vector3(0, 0, -2.2))
	asset("prop_charging_dock", Vector3(-4.0, 0, 1.9))
	label3d("RESOURCE FIELD", Vector3(-3, 0.04, -1.7))
	label3d("WORKSHOP", Vector3(3, 0.04, -2.25))
	label3d("KEP / CAPABILITY EXCHANGE", Vector3(0, 0.04, -3.05))
	for id in ["explorer", "builder"]:
		robots[id] = asset("robot_" + id, Vector3.ZERO)
	for i in range(4):
		var crate := asset("prop_cargo_crate", Vector3(2.0 + i * 0.7, 0, 1.8))
		crate.visible = false
		constructions.append(crate)
	var camera := Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 13.4
	camera.position = Vector3(8.8, 11.8, 14.8)
	add_child(camera)
	camera.look_at(Vector3(0.7, 0, 0))
	camera.current = true
	make_ui()
	if not capture_path.is_empty():
		index = frames.size() - 1
		paused = true
	show_frame()
	print("ROBOT_WORLD_REPLAY_READY: ", frames.size(), " frames; scripted policy; local KEP contract fixture")

func asset(id: String, at: Vector3) -> Node3D:
	var packed := load("res://models/" + id + ".glb") as PackedScene
	assert(packed != null, "Missing asset: " + id)
	var model := packed.instantiate() as Node3D
	add_child(model)
	model.position = at
	return model

func box(at: Vector3, size: Vector3, color: Color) -> void:
	var instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	mesh.material = material
	instance.mesh = mesh
	instance.position = at
	add_child(instance)

func label3d(text: String, at: Vector3) -> void:
	var label := Label3D.new()
	label.text = text
	label.font_size = 40
	label.pixel_size = 0.003
	label.modulate = Color("dce7e7")
	label.outline_size = 0
	label.rotation_degrees.x = -90
	label.position = at
	add_child(label)

func ui_label(parent: Node, text: String, at: Vector2, size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.position = at
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	parent.add_child(label)
	return label

func make_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	ui_label(layer, "ROBOT WORLD", Vector2(34, 24), 32, Color("edf4f4"))
	ui_label(layer, "A construction substrate for the KEP capability marketplace", Vector2(35, 67), 18, Color("a7c1cb"))
	ui_label(layer, "LOCAL PROTOTYPE  /  SCRIPTED AGENTS  /  RECORDED REPLAY", Vector2(35, 103), 14, Color("efbd70"))
	var panel := ColorRect.new()
	panel.position = Vector2(1045, 155)
	panel.size = Vector2(365, 430)
	panel.color = Color(0.055, 0.10, 0.14, 0.94)
	layer.add_child(panel)
	ui_label(layer, "WORLD STATE", Vector2(1065, 173), 17, Color("80d0c5"))
	status_label = ui_label(layer, "", Vector2(1065, 208), 18, Color("e1ebef"))
	ui_label(layer, "PARTICIPANT AGENTS", Vector2(1065, 334), 17, Color("80d0c5"))
	agent_label = ui_label(layer, "", Vector2(1065, 370), 17, Color("e1ebef"))
	ui_label(layer, "RWO: world + marketplace -> bridge", Vector2(35, 760), 18, Color("80d0c5"))
	ui_label(layer, "Recipe out. Versioned dataset result in. Independent histories.", Vector2(35, 790), 17, Color("b1c4cc"))
	time_label = ui_label(layer, "", Vector2(1065, 535), 16, Color("efbd70"))
	slider = HSlider.new()
	slider.position = Vector2(35, 834)
	slider.size = Vector2(1010, 26)
	slider.max_value = frames.size() - 1
	slider.step = 1
	layer.add_child(slider)
	slider.value_changed.connect(func(value: float):
		index = int(value)
		paused = true
		show_frame())
	ui_label(layer, "SPACE play/pause   R restart\nArrows step   Drag timeline", Vector2(1080, 814), 15, Color("b1c4cc"))

func show_frame() -> void:
	var state: Dictionary = frames[index]
	for id: String in robots:
		var actor: Dictionary = state.robots[id]
		var position: Array = actor.position
		var body: Node3D = robots[id]
		var next := Vector3(position[0], 0, position[1])
		if body.position.distance_to(next) > 0.01:
			body.rotation.y = atan2(next.x - body.position.x, next.z - body.position.z)
		body.position = next
	for i in constructions.size():
		constructions[i].visible = i < state.built
	status_label.text = "Tick %d  /  Revision %d\nConstructed: %d\nWorkshop stock: %d\nKnowledge results: %d" % [state.tick, state.revision, state.built, state.stock, state.knowledge.size()]
	agent_label.text = "Explorer / Alice\nCargo %d   Energy %d\n\nBuilder / Bob\nCargo %d   Energy %d" % [state.robots.explorer.cargo, state.robots.explorer.energy, state.robots.builder.cargo, state.robots.builder.energy]
	time_label.text = "Frame %d / %d" % [index + 1, frames.size()]
	slider.set_value_no_signal(index)

func _process(delta: float) -> void:
	if frames.is_empty():
		return
	if not paused:
		elapsed += delta
		if elapsed >= 0.25:
			elapsed = 0
			index = (index + 1) % frames.size()
			show_frame()
	rendered_frames += 1
	if rendered_frames == 20 and not capture_path.is_empty():
		await RenderingServer.frame_post_draw
		var error := get_viewport().get_texture().get_image().save_png(capture_path)
		print("CAPTURE_RESULT: ", error)
		get_tree().quit(error)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_SPACE:
			paused = not paused
		elif event.keycode == KEY_R:
			index = 0
			paused = false
		elif event.keycode == KEY_LEFT or event.keycode == KEY_RIGHT:
			index = clampi(index + (1 if event.keycode == KEY_RIGHT else -1), 0, frames.size() - 1)
			paused = true
		show_frame()
