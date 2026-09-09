"""Author real colony meshes with Blender 5.2 bpy; no Unity-render claim.

Run once per fresh revision with --revision v1. Outputs are versioned and never
overwrite an existing revision. Open questions: ../PLAN.md, Q-UI2 and Q-UI3.
"""
import argparse
import hashlib
import json
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--revision', default='v1')
args = parser.parse_args()
assert args.revision.isalnum(), 'Revision must be alphanumeric'
OUT = ROOT / 'unity/Assets/RobotWorld/Models' / ('Colony' + args.revision.upper())
PREVIEW = ROOT / 'checkpoints/02/preparation' / args.revision
SOURCE = ROOT / 'art/source' / ('colony-' + args.revision + '.blend')
assert not OUT.exists() and not PREVIEW.exists() and not SOURCE.exists(), 'Use a new revision'
OUT.mkdir(parents=True)
PREVIEW.mkdir(parents=True)
SOURCE.parent.mkdir(parents=True, exist_ok=True)
random.seed(217)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 8
scene.render.image_settings.file_format = 'PNG'
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.72, .78, .81, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .4

PALETTE = {'ivory':'DCD4BC','ivory_light':'F1EAD7','teal':'50817D','ochre':'C89540',
 'dark':'293735','rubber':'252B29','steel':'71807B','brass':'947449','glass':'14272C',
 'eye':'A6E6E2','lamp':'FFD893','soil':'91734A','stone':'746344','stone_light':'AB9067',
 'leaf':'73764A','leaf_light':'9D9E62','crystal':'BA7032','crystal_light':'E3A257','backdrop':'E9E4D8'}
M = {}
def linear(c): return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4
for key, color in PALETTE.items():
    rgb = [linear(int(color[i:i+2],16)/255) for i in (0,2,4)]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    n = m.node_tree.nodes['Principled BSDF']
    n.inputs['Base Color'].default_value = (*rgb,1)
    n.inputs['Roughness'].default_value = .78 if key in ('soil','stone','leaf','rubber') else .48
    n.inputs['Metallic'].default_value = .6 if key in ('steel','brass') else .1
    if key in ('eye','lamp'):
        n.inputs['Emission Color'].default_value = (*rgb,1)
        n.inputs['Emission Strength'].default_value = 2
    m.diffuse_color = (*rgb,1)
    M[key] = m

CURRENT = None
ASSETS = []
def begin(name):
    global CURRENT
    CURRENT = bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(CURRENT)
    CURRENT['asset_id'] = name
    CURRENT['units'] = 'meters'
    CURRENT['forward'] = '-Y Blender, +Z glTF'
    ASSETS.append(CURRENT)
    return CURRENT
def finish(o,name,mat,bevel=0):
    o.name = name
    o.data.materials.append(M[mat])
    if CURRENT: o.parent = CURRENT
    if bevel:
        b = o.modifiers.new('Manufactured radius','BEVEL');b.width=bevel;b.segments=4
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=b.name)
        for f in o.data.polygons: f.use_smooth=True
        b=o.modifiers.new('Face-weighted normals','WEIGHTED_NORMAL');b.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=b.name)
    return o
def box(name,p,size,mat='ivory',bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p)
    o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,min(bevel,min(size)*.42))
def cyl(name,p,r,d,mat='steel',axis='Z',verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=d,location=p)
    o=bpy.context.object
    if axis=='X':o.rotation_euler[1]=math.pi/2
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    return finish(o,name,mat,min(.016,d*.15,r*.12))
def ball(name,p,r,mat,scale=(1,1,1),ico=False):
    if ico:bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=p)
    else:bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=r,location=p)
    o=bpy.context.object;o.scale=scale
    if not ico:
        for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,mat)
def beam(name,a,b,r=.04,mat='steel'):
    a,b=Vector(a),Vector(b)
    o=cyl(name,(a+b)/2,r,(b-a).length,mat)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o
def ring(name,p,r,t,mat='steel',axis='Z'):
    bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=8,major_radius=r,minor_radius=t,location=p)
    o=bpy.context.object
    if axis=='X':o.rotation_euler[1]=math.pi/2
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,mat)
def bolts(xvals,y,zvals,mat='brass',r=.022):
    for x in xvals:
        for z in zvals:cyl('Recessed fastener',(x,y,z),r,.018,mat,'Y',12)
def pipe(name,points,r=.027,mat='rubber'):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,p in zip(s.bezier_points,points):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=CURRENT
    o.data.materials.append(M[mat]);return o

def wheel(x,y,accent):
    cyl('Tire',(x,y,.32),.30,.23,'rubber','X',32)
    side=1 if x>0 else -1
    ring('Tire shoulder',(x+side*.09,y,.32),.245,.055,'rubber','X')
    cyl('Cast wheel rim',(x+side*.13,y,.32),.185,.055,accent,'X',32)
    cyl('Hub ring',(x+side*.16,y,.32),.11,.04,'dark','X')
    cyl('Axle cap',(x+side*.19,y,.32),.06,.035,'brass','X',12)
    for i in range(16):
        t=i*math.tau/16
        o=box('Tread block',(x,y+math.sin(t)*.294,.32+math.cos(t)*.294),(.25,.072,.036),'rubber',.008)
        o.rotation_euler[0]=-t
    for i in range(5):
        t=i*math.tau/5
        cyl('Rim stud',(x+side*.19,y+math.sin(t)*.137,.32+math.cos(t)*.137),.015,.02,'steel','X',8)

def robot(role,accent):
    root=begin('robot_'+role)
    box('Drive frame',(0,0,.40),(.94,.94,.23),'dark',.08)
    box('Rounded body gasket',(0,0,.82),(.91,.83,.72),'dark',.16)
    box('Ivory body shell',(0,-.02,.86),(.86,.79,.68),'ivory',.15)
    box('Painted chest',(0,-.384,.90),(.70,.085,.40),accent,.11)
    box('Lower belly plate',(0,-.40,.59),(.68,.10,.19),'ivory_light',.055)
    box('Chest diagnostic inset',(0,-.434,.91),(.22,.018,.10),'dark',.018)
    for x in (-.06,0,.06):box('Diagnostic lamp',(x,-.448,.92),(.027,.012,.025),'eye',.006)
    bolts([-.26,.26],-.44,[.76,1.04],r=.017)
    box('Front bumper',(0,-.49,.42),(.86,.105,.13),'steel',.04)
    for x in (-.52,.52):
        for y in (-.32,.32):wheel(x,y,accent)
        beam('Suspension link',(x,-.32,.33),(x,.32,.44),.047,'steel')
    for z in (.73,.82,.91):box('Rear vent',(0,.40,z),(.41,.027,.026),'dark',.006)
    box('Rear power pack',(0,.48,.88),(.49,.22,.43),accent,.075)
    for x in (-.18,.18):beam('Backpack strap',(x,.61,.69),(x,.61,1.06),.017,'brass')
    cyl('Neck bearing',(0,-.005,1.25),.125,.20,'dark')
    ring('Neck bearing collar',(0,-.005,1.30),.12,.026,'brass')
    if role=='explorer':
        box('Binocular shell',(0,-.08,1.55),(.87,.51,.40),'ivory_light',.14)
        box('Sensor top panel',(0,-.015,1.745),(.50,.33,.035),accent,.028)
        for x in (-.22,.22):
            cyl('Optical housing',(x,-.31,1.55),.178,.23,'dark','Y',32)
            ring('Optical bezel',(x,-.434,1.55),.143,.026,'brass','Y')
            cyl('Optical glass',(x,-.441,1.55),.129,.022,'glass','Y',32)
            cyl('Luminous iris',(x,-.455,1.55),.062,.016,'eye','Y',32)
            ball('Lens glint',(x-.035,-.471,1.60),.024,'ivory_light',(.75,.3,1))
        pipe('Sensor loom',[(.32,.20,1.52),(.36,.32,1.29),(.26,.37,1.08)],.023)
        beam('Antenna',(.31,.28,1.12),(.36,.30,1.86),.013)
        ball('Antenna cap',(.36,.30,1.86),.04,accent)
    else:
        box('Head chassis',(0,-.08,1.54),(.77,.63,.58),'dark',.17)
        box('Ivory head',(0,-.06,1.57),(.81,.61,.58),'ivory_light',.17)
        box('Black face gasket',(0,-.373,1.56),(.65,.046,.39),'dark',.12)
        box('Face glass',(0,-.403,1.56),(.57,.035,.32),'glass',.105)
        for x in (-.14,.14):box('Luminous eye',(x,-.429,1.56),(.087,.022,.148),'eye',.04)
        box('Ochre crown',(0,-.04,1.849),(.47,.42,.055),accent,.035)
        for s in (-1,1):
            cyl('Ear bearing',(s*.415,-.02,1.56),.154,.10,accent,'X')
            cyl('Ear insert',(s*.472,-.02,1.56),.093,.022,'dark','X')
            a=(s*.49,-.02,1.04);b=(s*.77,-.20,.86);c=(s*.82,-.52,.71)
            ball('Shoulder bearing',a,.13,'dark')
            beam('Upper arm piston',a,b,.070,'steel');ball('Elbow',b,.105,accent)
            beam('Forearm',b,c,.067,'dark')
            beam('Forearm ram',(s*.73,-.26,.91),(s*.78,-.49,.78),.028,'brass')
            box('Wrist',c,(.21,.17,.13),accent,.027)
            for off in (-.105,.105):
                start=(c[0]+off,c[1]-.04,c[2]);end=(c[0]+off*1.2,c[1]-.21,c[2]-.13)
                beam('Gripper finger',start,end,.04,'dark')
                beam('Gripper tip',end,(c[0]+off*.65,c[1]-.25,c[2]-.15),.035,'steel')
            pipe('Hydraulic hose',[a,(s*.74,-.04,.95),b,c],.019)
    return root

explorer=robot('explorer','teal')
builder=robot('builder','ochre')

workshop=begin('prop_workshop')
box('Foundation',(0,0,.12),(3.0,2.45,.24),'stone',.10)
box('Floor deck',(0,0,.27),(2.75,2.22,.13),'steel',.055)
box('Rear bulkhead',(0,1.04,1.49),(2.55,.22,2.34),'dark',.09)
for s in (-1,1):
    box('Structural pier',(s*1.20,0,1.41),(.42,2.08,2.26),'dark',.15)
    for z in (.65,1.21,1.77,2.19):
        box('Ivory armor panel',(s*1.23,-.03,z),(.43,2.05,.51),'ivory',.105)
        bolts([s*1.13,s*1.32],-1.069,[z-.14,z+.14],r=.027)
    box('Foot shield',(s*1.23,-.82,.49),(.49,.42,.38),'brass',.06)
    pipe('Exterior conduit',[(s*1.5,.8,.44),(s*1.52,.7,1.10),(s*1.50,.3,1.20),(s*1.47,-.2,1.88)],.058)
    for z in (.7,1.3,1.8):
        box('Conduit clamp',(s*1.5,.42,z),(.14,.12,.08),'steel',.02)
# Segmented curved roof with visible panel seams and edge armor.
for i in range(9):
    t=-1.18+i*2.36/8
    x=math.sin(t)*1.20;z=2.14+math.cos(t)*.90
    o=box('Curved roof segment',(x,0,z),(.39,2.12,.12),'teal',.035)
    o.rotation_euler[1]=t
    for y in (-1.075,1.075):
        o=box('Roof armored rim',(x,y,z-.03),(.40,.19,.21),'ivory_light',.055)
        o.rotation_euler[1]=t
box('Entry eyebrow',(0,-1.08,2.31),(1.77,.29,.16),'teal',.06)
box('Entry lamp',(0,-1.13,2.19),(.88,.075,.05),'lamp',.014)
box('Tool bench',(0,.50,1.0),(1.97,.66,.15),'brass',.04)
for x in (-.70,.70):box('Bench cabinet',(x,.53,.65),(.50,.56,.59),'dark',.035)
for x in (-.70,.70):
    for z in (.50,.68,.86):
        box('Drawer',(x,.233,z),(.44,.022,.15),'teal',.012)
        box('Drawer handle',(x,.21,z+.02),(.19,.035,.023),'brass',.008)
box('Tool wall',(0,.891,1.72),(1.91,.055,.94),'teal',.035)
for i in range(9):
    x=-.76+i*.19
    beam('Hanging tool',(x,.83,1.55),(x+.03,.83,1.95),.02,'steel')
    ring('Tool end',(x+.03,.83,1.95),.043,.013,'brass','Y')
for i in range(7):
    x=-.8+i*.25
    box('Bench component',(x,.47,1.14),(.15,.21,.13),'ochre' if i%2 else 'steel',.021)
box('Bench screen',(.62,.68,1.40),(.42,.14,.35),'dark',.025)
box('Bench readout',(.62,.596,1.42),(.31,.02,.19),'eye',.015)
for i in range(3):box('Entry stair',(0,-1.33-i*.22,.22-i*.055),(1.80,.32,.10),'stone_light',.04)
cyl('Chimney',(.65,.62,3.12),.10,.58,'dark')
cyl('Chimney cap',(.65,.62,3.42),.145,.065,'brass')
beam('Crane first arm',(-1.08,.27,2.76),(-1.52,.04,3.39),.10,'dark')
beam('Crane second arm',(-1.52,.04,3.39),(-1.16,-.52,3.65),.095,'ochre')
for p in [(-1.08,.27,2.76),(-1.52,.04,3.39),(-1.16,-.52,3.65)]:cyl('Crane pivot',p,.14,.23,'brass','Y')
beam('Crane cable',(-1.16,-.52,3.65),(-1.16,-.52,3.18),.021,'rubber')
ring('Crane hook',(-1.16,-.52,3.14),.068,.018,'steel','Y')

market=begin('prop_market_terminal')
box('Terminal foundation',(0,0,.10),(1.25,1.15,.20),'stone',.075)
box('Terminal chassis',(0,.03,1.01),(.92,.71,1.75),'dark',.075)
for s in (-1,1):
    box('Terminal pillar',(s*.48,.01,1.03),(.20,.74,1.69),'ochre',.06)
    bolts([s*.48],-.377,[.39,1.71],r=.025)
box('Terminal roof',(0,0,1.94),(1.19,1.0,.22),'ivory',.09)
o=box('Terminal awning',(0,-.21,2.07),(1.13,.82,.09),'ochre',.04);o.rotation_euler[0]=.10
box('Screen rim',(0,-.39,1.28),(.72,.09,.70),'brass',.05)
box('Screen',(0,-.444,1.28),(.62,.024,.59),'glass',.035)
for i,w in enumerate([.40,.29,.37,.23]):box('Knowledge glyph',(0,-.461,1.46-i*.11),(w,.012,.022),'eye',.008)
box('Terminal keyboard',(0,-.48,.84),(.70,.32,.075),'steel',.025)
for i in range(5):box('Terminal key',(-.24+i*.12,-.52,.887),(.07,.09,.015),'ivory_light',.004)
pipe('Terminal power line',[(.52,.29,.31),(.67,.28,.75),(.59,.31,1.4)],.043)

dock=begin('prop_charging_dock')
box('Dock base',(0,0,.065),(2.25,1.38,.13),'dark',.12)
box('Dock tread',(0,0,.145),(2.10,1.24,.075),'steel',.10)
for x in (-.53,.53):
    cyl('Charging target',(x,0,.192),.43,.028,'dark',verts=48)
    ring('Charge contact',(x,0,.212),.32,.021,'brass')
    for y in (-.20,.20):box('Contact tab',(x,y,.22),(.09,.07,.015),'ivory_light',.007)
for x in (-.88,.88):box('Dock lamp',(x,-.49,.205),(.16,.07,.028),'eye',.012)
box('Dock bollard',(.82,.49,.62),(.23,.25,1.02),'ivory',.035)
box('Dock readout',(.82,.35,.88),(.15,.025,.19),'eye',.012)
pipe('Dock cable',[(.8,.52,1.17),(.64,.68,1.25),(.40,.65,.55),(.5,.43,.25)],.026)

crate=begin('prop_cargo_crate')
box('Crate gasket',(0,0,.42),(.80,.70,.81),'dark',.07)
box('Crate body',(0,0,.44),(.76,.66,.71),'ivory',.055)
box('Crate lid',(0,0,.85),(.81,.71,.13),'ivory_light',.045)
for x in (-.25,.25):
    box('Crate strap',(x,0,.46),(.12,.72,.82),'brass',.025)
    box('Crate latch',(x,-.379,.59),(.10,.055,.17),'dark',.018)
    bolts([x],-.410,[.56,.63],r=.012)
box('Crate handle',(0,-.35,.46),(.25,.04,.10),'dark',.023)

environment=begin('environment')
# Deterministic layered island, material-only glTF (no non-exportable shader nodes).
n=64; verts=[(0,0,-.015)];faces=[]
for i in range(n):
    t=i*math.tau/n;r=1+random.uniform(-.035,.035)
    verts.append((6.55*r*math.cos(t),4.7*r*math.sin(t),random.uniform(-.065,-.018)))
for i in range(n):faces.append((0,i+1,(i+1)%n+1))
mesh=bpy.data.meshes.new('Soil cap');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Soil cap',mesh);bpy.context.collection.objects.link(o);finish(o,'Soil cap','soil')
for layer in range(2):
    for i in range(60):
        t=i*math.tau/60
        ball('Layered edge stone',(6.2*math.cos(t),4.35*math.sin(t),-.24-layer*.33),.52,
             'stone' if (i+layer)%3 else 'stone_light',(1,.83,.76),True)
for i in range(310):
    t=random.random()*math.tau;r=math.sqrt(random.random())*.92
    x,y=6.35*r*math.cos(t),4.5*r*math.sin(t)
    ball('Embedded pebble',(x,y,.006),random.uniform(.028,.105),'stone_light' if i%3 else 'stone',(1,.8,.36),True)
for i in range(85):
    t=random.random()*math.tau;r=random.uniform(.73,.96)
    x,y=6.2*r*math.cos(t),4.35*r*math.sin(t)
    for j in range(4):
        a=t+j*1.6;h=random.uniform(.12,.33)
        o=ball('Leaf',(x+math.cos(a)*.07,y+math.sin(a)*.07,h*.43),1,'leaf' if j%2 else 'leaf_light',(.035,.085,h*.55))
        o.rotation_euler=(math.sin(a)*.50,math.cos(a)*.50,a)
for i in range(12):
    x=-3.7+random.uniform(-.75,.65);y=.62+random.uniform(-.55,.62);h=random.uniform(.25,1.2)
    bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=h*.26,radius2=h*.12,depth=h,location=(x,y,h*.5))
    finish(bpy.context.object,'Amber crystal','crystal' if i%2 else 'crystal_light')
    bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=h*.12,radius2=0,depth=h*.32,location=(x,y,h*1.16))
    finish(bpy.context.object,'Crystal termination','crystal_light')

# Freeze individual local-space glTF assets before composing the authoring view.
records=[]
for root in ASSETS:
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for child in root.children_recursive:child.select_set(True)
    bpy.context.view_layer.objects.active=root
    path=OUT/(root.name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
      export_apply=True,export_extras=True,export_yup=True)
    records.append({'asset_id':root.name,'path':str(path.relative_to(ROOT)),
       'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,
       'objects':len(root.children_recursive),'role':'actual authored mesh; Unity import unverified'})

placements={explorer:(-1.3,-.80,0),builder:(2.25,-.78,0),workshop:(.9,2.02,0),
 market:(4.35,1.2,0),dock:(-3.0,-2.4,0),crate:(.65,-2.9,0)}
for root,p in placements.items():root.location=p
for i in (1,2):
    copy=bpy.data.objects.new('Constructed crate '+str(i+1),None);bpy.context.collection.objects.link(copy)
    copy.location=(.65+i*.87,-2.9,0)
    for child in crate.children_recursive:
        c=child.copy();c.data=child.data;bpy.context.collection.objects.link(c);c.parent=copy
explorer.rotation_euler[2]=-.15;builder.rotation_euler[2]=-.20
CURRENT=None
box('Preview backdrop',(0,0,-.91),(200,200,.1),'backdrop',0)
def light(name,p,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=p
    o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
light('Warm softbox',(-5,-6,12),2300,7,(1,.86,.67))
light('Cool fill',(6,0,8),1100,8,(.75,.85,1))
light('Rim softbox',(0,7,9),1700,6,(1,.83,.59))
d=bpy.data.cameras.new('Preparation camera');cam=bpy.data.objects.new('Preparation camera',d)
bpy.context.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.lens=50
def render(name,p,target,scale,width=1440,height=960):
    cam.location=p;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();d.ortho_scale=scale
    scene.render.resolution_x=width;scene.render.resolution_y=height;scene.render.filepath=str(PREVIEW/name)
    bpy.ops.render.render(write_still=True)
render('colony-mesh-preview.png',(10,-16,13),(0,0,.7),17.2)
render('robots-mesh-preview.png',(5,-10,5),(.5,-.7,1),6.8,1280,800)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
report={'schema_version':'robot-world.asset-preparation/v1-prototype','blender_version':bpy.app.version_string,
 'seed':217,'revision':args.revision,'assets':records,'preview_renderer':'Blender Cycles CPU',
 'unity_import':'not_evaluated','unity_render':'not_evaluated','visual_match':'not_validated',
 'checkpoint_02_ready':False,'open_questions':'../../../PLAN.md#open-questions'}
(PREVIEW/'assets.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'ASSETS_AUTHORED','asset_count':len(records),'preview':str(PREVIEW)},indent=2),flush=True)
