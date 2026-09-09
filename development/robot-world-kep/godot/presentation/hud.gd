extends Control
## User-facing observation controls. Questions: ../../OPEN-QUESTIONS.md.

signal toggle_play
signal seek(value: int)
signal select_agent(id: String)
signal speed_changed(value: float)
signal reset_camera

const INK := Color("293e3d")
const MUTED := Color("788278")
const PAPER := Color("f8f5ed")
const LINE := Color("dadbce")
const TEAL := Color("507b71")
const GOLD := Color("b9914d")
var selected := "explorer"
var cards: Dictionary = {}
var energy: Dictionary = {}
var cargo: Dictionary = {}
var activity: Dictionary = {}
var top: Panel
var sidebar: Panel
var summary: Panel
var playback: Panel
var title: Label
var subtitle: Label
var play_button: Button
var world_button: Button
var catalog_button: Button
var reset_button: Button
var close_button: Button
var speed: OptionButton
var timeline: HSlider
var time_label: Label
var stat_labels: Array[Label] = []
var stock_label: Label
var knowledge_label: Label
var status_label: Label
var catalog_overlay: ColorRect
var catalog_panel: Panel
var catalog_rows: Array[Panel] = []
var current_state: Dictionary = {}
var total_frames := 0
var max_tick := 80

func style(bg: Color, border := LINE, radius := 16, shadow := true) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = bg
	box.border_color = border
	box.set_border_width_all(1)
	box.set_corner_radius_all(radius)
	if shadow:
		box.shadow_color = Color(0.23,0.25,0.19,0.08)
		box.shadow_size = 12
		box.shadow_offset = Vector2(0,4)
	return box

func panel(parent: Node, at: Vector2, dimensions: Vector2, color := PAPER) -> Panel:
	var node := Panel.new()
	node.position = at
	node.size = dimensions
	node.add_theme_stylebox_override("panel",style(color))
	parent.add_child(node)
	return node

func label(parent: Node, text: String, at: Vector2, font_size := 16, color := INK) -> Label:
	var node := Label.new()
	node.text = text
	node.position = at
	node.add_theme_font_size_override("font_size",font_size)
	node.add_theme_color_override("font_color",color)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(node)
	return node

func button(parent: Node, text: String, at: Vector2, dimensions: Vector2, filled := false) -> Button:
	var node := Button.new()
	node.text = text
	node.position = at
	node.size = dimensions
	node.add_theme_font_size_override("font_size",15)
	node.add_theme_color_override("font_color",PAPER if filled else INK)
	node.add_theme_color_override("font_hover_color",PAPER if filled else TEAL)
	node.add_theme_color_override("font_pressed_color",PAPER if filled else TEAL)
	node.add_theme_color_override("font_focus_color",PAPER if filled else INK)
	node.add_theme_stylebox_override("normal",style(TEAL if filled else PAPER,TEAL if filled else LINE,10,false))
	node.add_theme_stylebox_override("hover",style(TEAL.lightened(0.08) if filled else Color("e9eee4"),TEAL,10,false))
	node.add_theme_stylebox_override("pressed",style(TEAL.darkened(0.08) if filled else Color("dbe7dc"),TEAL,10,false))
	node.add_theme_stylebox_override("focus",style(Color(0,0,0,0),GOLD,10,false))
	parent.add_child(node)
	return node

func build(frame_count: int, offers: Array) -> void:
	total_frames = frame_count
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	top = panel(self,Vector2.ZERO,Vector2.ZERO)
	var logo := panel(top,Vector2(18,12),Vector2(38,38),TEAL)
	label(logo,"R",Vector2(10,1),26,PAPER)
	label(top,"ROBOT WORLD",Vector2(68,12),19)
	label(top,"A place to build together",Vector2(69,37),11,MUTED)
	world_button = button(top,"World",Vector2.ZERO,Vector2(96,38),true)
	world_button.pressed.connect(func(): show_catalog(false))
	catalog_button = button(top,"Capabilities  ·  %d" % offers.size(),Vector2.ZERO,Vector2(158,38))
	catalog_button.pressed.connect(func(): show_catalog(true))
	var badge := label(top,"●   RECORDED SESSION",Vector2.ZERO,12,TEAL)
	badge.name = "ReplayBadge"
	title = label(self,"Workshop Valley",Vector2(40,114),30)
	subtitle = label(self,"Colony 001  /  Shared discoveries begin here.",Vector2(42,156),15,MUTED)
	summary = panel(self,Vector2(40,208),Vector2(366,78))
	for i in 3:
		stat_labels.append(label(summary,"0",Vector2(22+i*119,9),24))
		label(summary,["CONSTRUCTIONS","ROBOT AGENTS","DISCOVERIES"][i],Vector2(22+i*119,47),10,MUTED)
	sidebar = panel(self,Vector2.ZERO,Vector2(310,477))
	label(sidebar,"YOUR COLONY",Vector2(22,19),12,TEAL)
	label(sidebar,"Meet the crew",Vector2(22,43),22)
	label(sidebar,"Select a robot to inspect its work.",Vector2(22,79),13,MUTED)
	for i in 2:
		var id: String = ["explorer","builder"][i]
		var card := button(sidebar,"",Vector2(16,118+i*134),Vector2(278,120))
		card.clip_contents = true
		card.pressed.connect(func(): set_selected(id); select_agent.emit(id))
		cards[id] = card
		var portrait := TextureRect.new()
		portrait.texture = load("res://presentation/robot_"+id+".png")
		portrait.position = Vector2(6,10)
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		portrait.size = Vector2(72,72)
		portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
		card.add_child(portrait)
		portrait.set_deferred("size",Vector2(72,72))
		label(card,id.capitalize(),Vector2(84,14),18)
		label(card,"Alice's agent" if id=="explorer" else "Bob's agent",Vector2(85,39),12,MUTED)
		activity[id] = label(card,"Collecting resources",Vector2(85,61),11,TEAL)
		var bar := ProgressBar.new()
		bar.position = Vector2(16,94)
		bar.show_percentage = false
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bar.add_theme_stylebox_override("background",style(Color("e3e6dc"),Color("e3e6dc"),3,false))
		bar.add_theme_stylebox_override("fill",style(TEAL if i==0 else GOLD,TEAL if i==0 else GOLD,3,false))
		bar.size = Vector2(118,6)
		card.add_child(bar)
		bar.set_deferred("size",Vector2(118,6))
		energy[id] = bar
		cargo[id] = label(card,"",Vector2(146,86),11,MUTED)
	stock_label = label(sidebar,"",Vector2(23,396),14)
	knowledge_label = label(sidebar,"",Vector2(23,427),13,MUTED)
	status_label = label(self,"",Vector2.ZERO,14,TEAL)
	reset_button = button(self,"Reset view",Vector2.ZERO,Vector2(102,34))
	reset_button.pressed.connect(func(): reset_camera.emit())
	playback = panel(self,Vector2.ZERO,Vector2.ZERO)
	play_button = button(playback,"Pause",Vector2(16,15),Vector2(92,40),true)
	play_button.pressed.connect(func(): toggle_play.emit())
	time_label = label(playback,"",Vector2(130,12),13)
	label(playback,"REPLAY",Vector2(130,39),10,MUTED)
	timeline = HSlider.new()
	timeline.min_value = 0
	timeline.max_value = frame_count-1
	timeline.step = 1
	timeline.position = Vector2(312,24)
	timeline.add_theme_stylebox_override("slider",style(Color("d8ddd2"),Color("d8ddd2"),3,false))
	timeline.add_theme_stylebox_override("grabber_area",style(TEAL,TEAL,3,false))
	playback.add_child(timeline)
	timeline.value_changed.connect(func(value: float): seek.emit(int(value)))
	speed = OptionButton.new()
	speed.add_item("0.5×",0)
	speed.add_item("1×",1)
	speed.add_item("2×",2)
	speed.select(1)
	speed.size = Vector2(77,38)
	speed.add_theme_color_override("font_color",INK)
	speed.add_theme_color_override("font_focus_color",INK)
	speed.add_theme_color_override("font_hover_color",INK)
	speed.add_theme_stylebox_override("normal",style(Color("eeeede"),LINE,8,false))
	speed.add_theme_stylebox_override("hover",style(Color("e2e9db"),TEAL,8,false))
	playback.add_child(speed)
	speed.item_selected.connect(func(i: int): speed_changed.emit([0.5,1.0,2.0][i]))
	make_catalog(offers)
	set_selected(selected)
	resized.connect(layout)
	layout()

func layout() -> void:
	var w := size.x
	var h := size.y
	var margin := 28.0 if w < 1300 else 36.0
	top.position = Vector2(margin,20)
	top.size = Vector2(w-margin*2,64)
	world_button.position = Vector2(top.size.x*0.43,13)
	catalog_button.position = world_button.position+Vector2(104,0)
	top.get_node("ReplayBadge").position = Vector2(top.size.x-177,24)
	top.get_node("ReplayBadge").visible = w >= 1050
	sidebar.position = Vector2(w-margin-310,118)
	sidebar.size.y = minf(477,h-233)
	for i in 2:
		cards[["explorer","builder"][i]].position.y = 118+i*134
	stock_label.visible = sidebar.size.y >= 435
	knowledge_label.visible = sidebar.size.y >= 460
	summary.visible = h >= 780 and w >= 1280
	title.position = Vector2(margin+4,117)
	subtitle.position = Vector2(margin+6,159)
	reset_button.position = Vector2(w-margin-310,h-155)
	status_label.position = Vector2(margin+4,h-132)
	playback.position = Vector2(margin,h-94)
	playback.size = Vector2(w-margin*2,70)
	timeline.size = Vector2(playback.size.x-428,22)
	speed.position = Vector2(playback.size.x-97,16)
	catalog_overlay.size = size
	catalog_panel.size = Vector2(minf(760,w-60),444)
	catalog_panel.position = (size-catalog_panel.size)*0.5
	close_button.position = Vector2(catalog_panel.size.x-100,22)
	for row in catalog_rows:
		row.size.x = catalog_panel.size.x-48

func set_selected(id: String) -> void:
	selected = id
	for key: String in cards:
		cards[key].add_theme_stylebox_override("normal",style(Color("eef2e8") if key==id else PAPER,TEAL if key==id else LINE,13,false))

func update_state(state: Dictionary, frame_index: int, paused: bool) -> void:
	current_state = state
	stat_labels[0].text = str(int(state.built))
	stat_labels[1].text = str(state.robots.size())
	stat_labels[2].text = str(state.knowledge.size())
	for id: String in cards:
		var actor: Dictionary = state.robots[id]
		energy[id].value = actor.energy
		cargo[id].text = "%d%%  ·  Cargo %d/3" % [actor.energy,actor.cargo]
		if actor.cargo >= 3:
			activity[id].text = "Delivering to the workshop"
		elif id=="builder" and state.stock>=6 and actor.cargo==0:
			activity[id].text = "Heading to construction"
		else:
			activity[id].text = "Collecting resources"
	stock_label.text = "Workshop stores     %02d resources" % state.stock
	knowledge_label.text = "%d knowledge result shared with the colony" % state.knowledge.size()
	status_label.text = "●  %d constructions completed  ·  %d shared discovery" % [state.built,state.knowledge.size()]
	time_label.text = "Tick %03d / %03d" % [state.tick,max_tick]
	play_button.text = "Play" if paused else "Pause"
	timeline.set_value_no_signal(frame_index)

func make_catalog(offers: Array) -> void:
	catalog_overlay = ColorRect.new()
	catalog_overlay.color = Color(0.12,0.19,0.17,0.28)
	catalog_overlay.visible = false
	add_child(catalog_overlay)
	catalog_panel = panel(catalog_overlay,Vector2.ZERO,Vector2(760,444))
	label(catalog_panel,"SHARED CAPABILITIES",Vector2(26,24),11,TEAL)
	label(catalog_panel,"What the colony can share",Vector2(26,48),25)
	label(catalog_panel,"Versioned artifacts from this recorded session.",Vector2(26,87),14,MUTED)
	close_button = button(catalog_panel,"Close",Vector2(660,22),Vector2(74,34))
	close_button.pressed.connect(func(): show_catalog(false))
	for i in offers.size():
		var offer: Dictionary = offers[i]
		var row := panel(catalog_panel,Vector2(24,132+i*130),Vector2(712,112),Color("efefe5"))
		catalog_rows.append(row)
		var is_dataset: bool = offer.artifact_type=="dataset"
		label(row,"DATASET · RESEARCH" if is_dataset else "WORKFLOW · CONSTRUCTION",Vector2(18,12),10,TEAL)
		label(row,"Indicator dataset" if is_dataset else "Resource workshop recipe",Vector2(18,33),19)
		label(row,"Synthetic fixture · Alice and Bob can consume" if is_dataset else "Contributed by Alice and Bob · Simulation use",Vector2(18,63),12,MUTED)
		label(row,"Version  " + str(offer.version).substr(0,16),Vector2(18,87),10,MUTED)
	label(catalog_panel,"Local exchange fixture  ·  No deployment or purchase occurs here.",Vector2(26,410),12,MUTED)

func show_catalog(visible_now: bool) -> void:
	catalog_overlay.visible = visible_now
	if visible_now:
		close_button.grab_focus()
	else:
		catalog_button.grab_focus()
