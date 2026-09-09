"""Version 2 authored geometry/material preparation; Blender rendering only.

Creates procedural PBR maps from numeric fields, reauthors scenery and exports
embedded glTF textures. Does not edit the approved concept or any preview image.
Open questions: ../PLAN.md, Q-UI2 and Q-UI3.
"""
import hashlib
import json
import math
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'unity/Assets/RobotWorld/Models/ColonyV2'
TEX=ROOT/'unity/Assets/RobotWorld/Textures/ColonyV2'
PREVIEW=ROOT/'checkpoints/02/preparation/v2'
SOURCE=ROOT/'art/source/colony-v2.blend'
assert not OUT.exists() and not TEX.exists() and not PREVIEW.exists() and not SOURCE.exists()
for p in (OUT,TEX,PREVIEW):p.mkdir(parents=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/source/colony-v1.blend'))
scene=bpy.context.scene
N=512
rng=np.random.default_rng(217)
y,x=np.mgrid[0:N,0:N].astype(np.float32)/N

def field(seed):
    random=np.random.default_rng(seed)
    value=np.zeros((N,N),dtype=np.float32)
    for f,amp in [(2,.46),(5,.24),(13,.14),(31,.08),(79,.05),(163,.025)]:
        for _ in range(3):
            a,b=random.integers(1,f+1,2)
            value+=amp*np.cos(math.tau*(a*x+b*y)+random.uniform(0,math.tau))/3
    return (value-value.min())/(value.max()-value.min())

def image(name,values,color=False):
    if values.ndim==2:values=np.repeat(values[:,:,None],3,axis=2)
    rgba=np.ones((N,N,4),dtype=np.float32);rgba[:,:,:3]=np.clip(values,0,1)
    im=bpy.data.images.new(name,width=N,height=N,alpha=False,float_buffer=True)
    im.colorspace_settings.name='Linear Rec.709' if color else 'Non-Color'
    im.pixels.foreach_set(rgba.ravel());im.filepath_raw=str(TEX/(name+'.png'));im.file_format='PNG'
    im.save();im.pack();return im

prepared=[]
for i,name in enumerate(['ivory','ivory_light','teal','ochre','steel','brass','soil','stone','stone_light','crystal','crystal_light']):
    m=bpy.data.materials[name];nodes=m.node_tree.nodes;links=m.node_tree.links
    bsdf=nodes.get('Principled BSDF');base=np.array(bsdf.inputs['Base Color'].default_value[:3])
    organic=name in ('soil','stone','stone_light','crystal','crystal_light')
    noise=field(i+40);fine=field(i+300);dust=np.clip((noise-.46)*3.4,0,1)
    if organic:
        colors=base[None,None,:]*(.60+.66*noise[:,:,None])
        roughness=.73+.23*fine;strength=3.0
    else:
        edge=np.minimum.reduce([x,1-x,y,1-y])
        chips=(edge<(.006+.014*fine)) & (noise>.49)
        specks=(rng.random((N,N))>.989) & (noise>.52)
        wear=(chips | specks).astype(np.float32)
        colors=base[None,None,:]*(.82+.24*noise[:,:,None])
        grime=np.array([.12,.075,.035])
        colors=colors*(1-dust[:,:,None]*.14)+grime*dust[:,:,None]*.14
        colors=colors*(1-wear[:,:,None]*.74)+np.array([.085,.069,.046])*wear[:,:,None]*.74
        roughness=np.clip(.43+.28*fine+wear*.18,0,1);strength=.38
    baseim=image(name+'-base',colors,True)
    roughim=image(name+'-roughness',roughness)
    dy,dx=np.gradient(fine)
    normal=np.stack([-dx*strength,-dy*strength,np.ones_like(dx)],axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    normalim=image(name+'-normal',normal*.5+.5)
    for im,inputname in [(baseim,'Base Color'),(roughim,'Roughness')]:
        t=nodes.new('ShaderNodeTexImage');t.image=im;links.new(t.outputs['Color'],bsdf.inputs[inputname])
    t=nodes.new('ShaderNodeTexImage');t.image=normalim
    n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=1
    links.new(t.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],bsdf.inputs['Normal'])
    prepared.append(name)

environment=bpy.data.objects['environment']
# Rework capsule placeholders into long leaves and make the stone silhouettes irregular.
for o in list(environment.children_recursive):
    if o.type!='MESH':continue
    if o.name.startswith('Leaf'):
        o.scale.x*=.36;o.scale.y*=.54;o.scale.z*=1.75
        for v in o.data.vertices:
            v.co.y+=.25*v.co.z*v.co.z
    elif o.name.startswith('Layered edge stone'):
        for v in o.data.vertices:
            v.co.x*=float(rng.uniform(.89,1.10));v.co.y*=float(rng.uniform(.89,1.10))
            v.co.z*=float(rng.uniform(.78,1.12))
    # World-space planar UVs keep rock/soil detail at a comparable physical scale.
    if o.data.materials and o.data.materials[0].name in ('soil','stone','stone_light'):
        uv=o.data.uv_layers.active or o.data.uv_layers.new(name='Surface scale')
        for poly in o.data.polygons:
            axis=max(range(3),key=lambda a:abs(poly.normal[a]))
            a,b=[a for a in range(3) if a!=axis]
            for li in poly.loop_indices:
                p=o.matrix_world @ o.data.vertices[o.data.loops[li].vertex_index].co
                uv.data[li].uv=(p[a]*.85,p[b]*.85)

# Real warm light makes the authored interior readable in the preparation render.
d=bpy.data.lights.new('Workshop work light','AREA');d.energy=95;d.shape='RECTANGLE';d.size=1.1;d.color=(1,.66,.30)
l=bpy.data.objects.new('Workshop work light',d);bpy.context.collection.objects.link(l)
l.location=(.9,1.40,2.12);l.rotation_euler=(0,0,0)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.30
bpy.data.lights['Warm softbox'].energy=2500
bpy.data.lights['Cool fill'].energy=650

roots=[bpy.data.objects[n] for n in ['robot_explorer','robot_builder','prop_workshop','prop_market_terminal','prop_charging_dock','prop_cargo_crate','environment']]
records=[]
for root in roots:
    transform=root.matrix_world.copy();root.location=(0,0,0);root.rotation_euler=(0,0,0)
    # Static props merge by material; the robot part hierarchy stays editable.
    if not root.name.startswith('robot_'):
        groups={}
        for o in list(root.children_recursive):
            if o.type=='CURVE':
                bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
                bpy.ops.object.convert(target='MESH');o=bpy.context.object
            if o.type=='MESH' and len(o.data.materials)==1:
                groups.setdefault(o.data.materials[0].name,[]).append(o)
        for mat,objects in groups.items():
            if len(objects)<2:continue
            bpy.ops.object.select_all(action='DESELECT')
            for o in objects:o.select_set(True)
            bpy.context.view_layer.objects.active=objects[0]
            bpy.ops.object.join();bpy.context.object.name=root.name+'_'+mat
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for o in root.children_recursive:o.select_set(True)
    bpy.context.view_layer.objects.active=root
    path=OUT/(root.name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
        export_apply=True,export_extras=True,export_yup=True)
    records.append({'asset_id':root.name,'path':str(path.relative_to(ROOT)),
        'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size,
        'objects':len(root.children_recursive)})
    root.matrix_world=transform

scene.camera.location=(9,-17,12.5)
scene.camera.rotation_euler=(Vector((0,0,.7))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=16.4
scene.render.resolution_x=1440;scene.render.resolution_y=960
scene.render.filepath=str(PREVIEW/'colony-mesh-preview.png')
bpy.ops.render.render(write_still=True)
scene.camera.location=(4,-10,4.5)
scene.camera.rotation_euler=(Vector((.4,-.7,1))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=6.6
scene.render.resolution_x=1280;scene.render.resolution_y=800
scene.render.filepath=str(PREVIEW/'robots-mesh-preview.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
(PREVIEW/'assets.json').write_text(json.dumps({'schema_version':'robot-world.asset-preparation/v1-prototype',
 'revision':'v2','blender_version':bpy.app.version_string,'assets':records,'pbr_materials':prepared,
 'preview_renderer':'Blender Cycles CPU','unity_import':'not_evaluated','unity_render':'not_evaluated',
 'visual_match':'not_validated','checkpoint_02_ready':False,'open_questions':'../../../PLAN.md#open-questions'},indent=2)+'\n')
print('MATERIAL_REFINEMENT_COMPLETE',flush=True)
