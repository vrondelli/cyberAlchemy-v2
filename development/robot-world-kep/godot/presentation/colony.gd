extends Node3D
## Presentation of the existing deterministic replay. Questions: ../../OPEN-QUESTIONS.md.

const Scenery = preload("res://presentation/scenery.gd")
const Hud = preload("res://presentation/hud.gd")
var scenery: Node3D
var hud: Control
var camera: Camera3D
var frames: Array = []
var index := 0
var elapsed := 0.0
var speed := 1.0
var paused := false
var selected := "explorer"
var robots: Dictionary = {}
var targets: Dictionary = {}
var shadows: Dictionary = {}
var crates: Array[Node3D] = []
var ring: Node3D
var nametag: Label3D
var orbit := 0.53
var elevation := 0.74
var zoom := 12.8
var focus := Vector3.ZERO
var capture_path := ""
var verify_path := ""
var capture_catalog := false
var capture_index := -1
var rendered_frames := 0
var verifying := false
var loaded_custom_replay := false

func _ready() -> void:
	var replay_path := "res://replay.json"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--replay="):
			replay_path = arg.trim_prefix("--replay=")
			loaded_custom_replay = true
		elif arg.begins_with("--capture="):
			capture_path = arg.trim_prefix("--capture=")
		elif arg.begins_with("--verify-ui="):
			verify_path = arg.trim_prefix("--verify-ui=")
		elif arg.begins_with("--frame="):
			capture_index = int(arg.trim_prefix("--frame="))
		elif arg=="--catalog":
			capture_catalog = true
	var replay = JSON.parse_string(FileAccess.get_file_as_string(replay_path))
	if not replay is Dictionary or not replay.has("frames") or replay.frames.is_empty():
		push_error("Valid recorded world replay required: " + replay_path)
		get_tree().quit(1)
		return
	frames = replay.frames
	var catalog: Array = []
	# The bundled catalog belongs to the bundled replay, never an unrelated custom run.
	if not loaded_custom_replay:
		catalog = JSON.parse_string(FileAccess.get_file_as_string("res://presentation/catalog.json"))
	Engine.max_fps = 60
	make_lighting()
	scenery = Scenery.new()
	add_child(scenery)
	scenery.build()
	for id in ["explorer","builder"]:
		robots[id] = scenery.asset("robot_"+id,Vector3.ZERO)
		shadows[id] = scenery.contact(Vector3.ZERO,Vector2(1.7,1.35),0.34)
	for i in 4:
		var crate: Node3D = scenery.asset("prop_cargo_crate",Vector3(2.0+i*0.7,0,1.8))
		crate.visible = false
		crates.append(crate)
	make_selection()
	camera = Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.current = true
	add_child(camera)
	update_camera()
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = Hud.new()
	layer.add_child(hud)
	hud.build(frames.size(),catalog)
	hud.max_tick = int(frames.back().tick)
	hud.toggle_play.connect(toggle_play)
	hud.seek.connect(seek)
	hud.select_agent.connect(select_agent)
	hud.speed_changed.connect(func(value: float): speed=value)
	hud.reset_camera.connect(reset_camera)
	if not capture_path.is_empty():
		index = frames.size()-1 if capture_index<0 else clampi(capture_index,0,frames.size()-1)
		paused = true
	show_frame(true)
	if capture_catalog:
		hud.show_catalog(true)
	if not verify_path.is_empty():
		verifying = true
		verify_controls.call_deferred()
	print("COLONY_UI_READY: ",frames.size()," recorded frames; UI 002")

func make_lighting() -> void:
	var node := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("d5cebe")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("e5ddc6")
	env.ambient_light_energy = 0.30
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	if RenderingServer.get_rendering_device()!=null:
		env.tonemap_mode = Environment.TONE_MAPPER_AGX
		env.ssao_enabled = true
		env.ssao_radius = 1.2
		env.ssao_intensity = 1.1
		env.ssao_power = 1.3
	node.environment = env
	add_child(node)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-55,-32,0)
	key.light_color = Color("fff0d7")
	key.light_energy = 0.50
	key.shadow_enabled = true
	key.shadow_blur = 2.0
	key.directional_shadow_max_distance = 40
	key.shadow_bias = 0.025
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-35,140,0)
	fill.light_color = Color("d3e0dc")
	fill.light_energy = 0.12
	add_child(fill)

func make_selection() -> void:
	var mesh := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.73
	torus.outer_radius = 0.755
	torus.rings = 48
	torus.ring_segments = 8
	mesh.mesh = torus
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("5c8b7f")
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh.material_override = mat
	mesh.scale.y = 0.2
	ring = mesh
	add_child(ring)
	nametag = Label3D.new()
	nametag.font_size = 32
	nametag.pixel_size = 0.004
	nametag.modulate = Color("f5f2e4")
	nametag.outline_modulate = Color("3b534b")
	nametag.outline_size = 9
	nametag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(nametag)

func show_frame(instant := false) -> void:
	var state: Dictionary = frames[index]
	for id: String in robots:
		var pos: Array = state.robots[id].position
		targets[id] = Vector3(pos[0],0,pos[1])
		if instant:
			robots[id].position = targets[id]
			# Face the observation camera when no movement direction is being shown.
			robots[id].rotation.y = 0.15
	for i in crates.size():
		crates[i].visible = i < state.built
	hud.update_state(state,index,paused)
	update_selection()

func toggle_play() -> void:
	paused = not paused
	if not paused and index==frames.size()-1:
		index = 0
		show_frame(true)
	hud.update_state(frames[index],index,paused)

func seek(value: int) -> void:
	index = clampi(value,0,frames.size()-1)
	paused = true
	elapsed = 0
	show_frame(true)

func select_agent(id: String) -> void:
	if not robots.has(id):
		return
	selected = id
	hud.set_selected(id)
	update_selection()

func update_selection() -> void:
	if not robots.has(selected):
		return
	ring.position = robots[selected].position+Vector3(0,0.045,0)
	nametag.position = robots[selected].position+Vector3(0,1.65,0)
	nametag.text = selected.capitalize()
	for id: String in shadows:
		shadows[id].position = robots[id].position+Vector3(0,0.012,0)

func update_camera() -> void:
	camera.size = zoom
	camera.h_offset = 2.1
	camera.position = focus+Vector3(sin(orbit)*cos(elevation),sin(elevation),cos(orbit)*cos(elevation))*22
	camera.look_at(focus)

func reset_camera() -> void:
	orbit = 0.53
	elevation = 0.74
	zoom = 12.8
	focus = Vector3.ZERO
	update_camera()

func _process(delta: float) -> void:
	if frames.is_empty():
		return
	if not paused and not verifying:
		elapsed += delta*speed
		while elapsed >= 0.32:
			elapsed -= 0.32
			index += 1
			if index >= frames.size():
				index = frames.size()-1
				paused = true
			show_frame()
			if paused:
				break
	for id: String in robots:
		var actor: Node3D = robots[id]
		var direction: Vector3 = targets[id]-actor.position
		if direction.length() > 0.015:
			actor.rotation.y = lerp_angle(actor.rotation.y,atan2(direction.x,direction.z),minf(delta*12,1))
			actor.position = actor.position.lerp(targets[id],minf(delta*14,1))
	update_selection()
	rendered_frames += 1
	if rendered_frames==40 and not capture_path.is_empty() and not verifying:
		hud.show_catalog(capture_catalog)
		await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var result := get_viewport().get_texture().get_image().save_png(capture_path)
		print("COLONY_CAPTURE: ",result)
		get_tree().quit(result)

func _unhandled_input(event: InputEvent) -> void:
	if hud==null or hud.catalog_overlay.visible:
		return
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		orbit -= event.relative.x*0.006
		elevation = clampf(elevation+event.relative.y*0.004,0.35,1.3)
		update_camera()
	if event is InputEventMouseButton and event.pressed:
		if event.button_index==MOUSE_BUTTON_WHEEL_UP:
			zoom = maxf(6.5,zoom-0.5)
		elif event.button_index==MOUSE_BUTTON_WHEEL_DOWN:
			zoom = minf(18,zoom+0.5)
		elif event.button_index==MOUSE_BUTTON_LEFT:
			for id: String in robots:
				var point := camera.unproject_position(robots[id].position+Vector3(0,0.6,0))
				if point.distance_to(event.position)<55:
					select_agent(id)
					break
		update_camera()

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode==KEY_ESCAPE:
			hud.show_catalog(false)
		elif not hud.catalog_overlay.visible:
			if event.keycode==KEY_SPACE:
				toggle_play()
			elif event.keycode==KEY_R:
				reset_camera()
			elif event.keycode==KEY_LEFT or event.keycode==KEY_RIGHT:
				seek(index+(1 if event.keycode==KEY_RIGHT else -1))
			elif event.keycode==KEY_1 or event.keycode==KEY_2:
				select_agent("explorer" if event.keycode==KEY_1 else "builder")

func verify_controls() -> void:
	await get_tree().process_frame
	var checks: Dictionary = {}
	paused = true
	hud.play_button.pressed.emit()
	checks["play_control"] = not paused
	hud.play_button.pressed.emit()
	checks["pause_control"] = paused
	hud.timeline.value = 27
	checks["timeline_updates_state"] = index==27 and hud.current_state==frames[27] and paused
	hud.cards.builder.pressed.emit()
	checks["agent_card_selection"] = selected=="builder" and hud.selected=="builder" and nametag.text=="Builder"
	hud.speed.select(2)
	hud.speed.item_selected.emit(2)
	checks["speed_control"] = speed==2.0
	hud.catalog_button.pressed.emit()
	checks["catalog_shows_actual_offers"] = hud.catalog_overlay.visible and hud.catalog_rows.size()==2
	hud.close_button.pressed.emit()
	checks["catalog_close"] = not hud.catalog_overlay.visible
	orbit = 1.0
	zoom = 8.0
	hud.reset_button.pressed.emit()
	checks["camera_reset"] = is_equal_approx(orbit,0.53) and is_equal_approx(zoom,12.8)
	seek(frames.size()-1)
	checks["final_replay_counts"] = hud.stat_labels[0].text=="3" and hud.stat_labels[2].text=="1"
	for i in crates.size():
		checks["crate_visibility_%d" % i] = crates[i].visible==(i<3)
	checks["layout_bounds"] = hud.sidebar.position.x>=0 and hud.sidebar.position.x+hud.sidebar.size.x<=hud.size.x and hud.playback.position.y+hud.playback.size.y<=hud.size.y
	for id: String in hud.cards:
		for child in hud.cards[id].get_children():
			if child is TextureRect:
				checks["portrait_bounds_"+id] = child.size==Vector2(72,72)
			if child is ProgressBar:
				checks["energy_bar_bounds_"+id] = child.size==Vector2(118,6)
	var passed := true
	for value in checks.values():
		passed = passed and bool(value)
	var file := FileAccess.open(verify_path,FileAccess.WRITE)
	file.store_string(JSON.stringify({"status":"PASS" if passed else "FAIL","checks":checks,"viewport":[hud.size.x,hud.size.y],"open_questions":"../../OPEN-QUESTIONS.md"},"  "))
	file.close()
	print("COLONY_UI_CHECKS: ","PASS" if passed else "FAIL")
	get_tree().quit(0 if passed else 1)
