extends SceneTree
func _initialize() -> void:
 call_deferred("inspect")
func inspect() -> void:
 var hud = load("res://presentation/hud.gd").new()
 root.add_child(hud)
 hud.build(82,[])
 await process_frame
 for id in hud.cards:
  var card = hud.cards[id]
  for child in card.get_children():
   if child is TextureRect or child is ProgressBar:
    print(id," ",child.get_class()," size=",child.size," min=",child.get_combined_minimum_size()," pos=",child.position)
    if child is TextureRect:
     print("expand=",child.expand_mode," stretch=",child.stretch_mode)
 quit()
