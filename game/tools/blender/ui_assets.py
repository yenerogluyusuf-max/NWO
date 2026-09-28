"""Rendert die Messing-, Emaille- und Wachsteile der Oberfläche mit Blender (Cycles).

Aufruf (Blender als Python-Modul, `pip install bpy`):
    python tools/blender/ui_assets.py <ausgabeordner> [teil ...]

Alle Teile werden von oben mit orthografischer Kamera gerendert, Licht von
oben links wie im übrigen Design, Hintergrund transparent.
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "public/ui")
ONLY = set(sys.argv[2:])
SAMPLES = 96


# --------------------------------------------------------------------------
# Szene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    world = bpy.data.worlds.new("Welt")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.22, 0.18, 0.14, 1)
    bg.inputs["Strength"].default_value = 0.35

    # Softboxen: warmes Hauptlicht oben links, kühles Gegenlicht, Aufheller
    def softbox(name, loc, size, energy, color):
        bpy.ops.object.light_add(type="AREA", location=loc)
        light = bpy.context.object
        light.name = name
        light.data.shape = "RECTANGLE"
        light.data.size = size
        light.data.size_y = size * 0.6
        light.data.energy = energy
        light.data.color = color
        direction = Vector((0, 0, 0)) - light.location
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    softbox("Haupt", (-4, 4, 6), 4, 520, (1.0, 0.92, 0.78))
    softbox("Gegen", (5, -3, 3), 3, 110, (0.8, 0.88, 1.0))
    softbox("Oben", (0, 0, 8), 3, 60, (1, 1, 1))
    return scene


def camera(scene, width, height, ortho_scale, res_scale=1.0):
    bpy.ops.object.camera_add(location=(0, 0, 10), rotation=(0, 0, 0))
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ortho_scale
    scene.camera = cam
    scene.render.resolution_x = int(width * res_scale)
    scene.render.resolution_y = int(height * res_scale)
    scene.render.resolution_percentage = 100


def render(scene, name):
    OUT.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(OUT / f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("gerendert:", scene.render.filepath)


# --------------------------------------------------------------------------
# Materialien


def principled(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat, mat.node_tree.nodes["Principled BSDF"], mat.node_tree


def bump(tree, bsdf, scale, strength, detail=6.0):
    nodes, links = tree.nodes, tree.links
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    b = nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    links.new(noise.outputs["Fac"], b.inputs["Height"])
    links.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return noise


def brass(name="Messing", tone=(0.72, 0.5, 0.22)):
    mat, bsdf, tree = principled(name)
    bsdf.inputs["Base Color"].default_value = (*tone, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.27
    # leichte Patina: Rauheit schwankt
    nodes, links = tree.nodes, tree.links
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 14
    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = 0.26
    ramp.inputs["To Max"].default_value = 0.48
    links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])
    bump(tree, bsdf, 60, 0.04)
    return mat


def dark_metal(name="Dunkel"):
    mat, bsdf, tree = principled(name)
    bsdf.inputs["Base Color"].default_value = (0.09, 0.07, 0.055, 1)
    bsdf.inputs["Metallic"].default_value = 0.8
    bsdf.inputs["Roughness"].default_value = 0.38
    return mat


def enamel(name, color):
    mat, bsdf, tree = principled(name)
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = 0.3
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.12
    bump(tree, bsdf, 9, 0.05, 3)
    return mat


def wax(name="Wachs", color=(0.26, 0.018, 0.012)):
    mat, bsdf, tree = principled(name)
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = 0.42
    bsdf.inputs["Subsurface Weight"].default_value = 0.15
    bsdf.inputs["Subsurface Radius"].default_value = (0.5, 0.08, 0.05)
    bsdf.inputs["Coat Weight"].default_value = 0.3
    bump(tree, bsdf, 18, 0.12)
    return mat


# --------------------------------------------------------------------------
# Bausteine


def assign(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def smooth(obj, bevel=0.0, segments=4):
    if bevel:
        mod = obj.modifiers.new("Fase", "BEVEL")
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


def disk(radius, depth, z, mat, verts=96, bevel=0.02):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    smooth(obj, bevel)
    assign(obj, mat)
    return obj


def torus(major, minor, z, mat, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=128, minor_segments=24, location=(0, 0, z))
    obj = bpy.context.object
    obj.scale = scale
    smooth(obj)
    assign(obj, mat)
    return obj


def beads(radius, count, size, z, mat, scale=(1, 1)):
    for k in range(count):
        a = 2 * math.pi * k / count
        bpy.ops.mesh.primitive_uv_sphere_add(radius=size, location=(radius * math.cos(a) * scale[0], radius * math.sin(a) * scale[1], z), segments=16, ring_count=8)
        obj = bpy.context.object
        smooth(obj)
        assign(obj, mat)


def star_mesh(name, points, r_out, r_in, depth, z, mat, rotation=0.0):
    import bmesh

    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    verts = []
    for k in range(points * 2):
        a = rotation + math.pi / 2 + math.pi * k / points
        r = r_out if k % 2 == 0 else r_in
        verts.append(bm.verts.new((r * math.cos(a), r * math.sin(a), 0)))
    face = bm.faces.new(verts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, 0, depth))
    bm.to_mesh(mesh)
    bm.free()
    obj.location.z = z
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    smooth(obj, 0.004, 2)
    assign(obj, mat)
    return obj


def crescent_star(z, depth, mat, scale=1.0):
    """Halbmond und Stern als erhabenes Relief."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.42 * scale, depth=depth, location=(-0.1 * scale, 0, z))
    outer = bpy.context.object
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.34 * scale, depth=depth * 3, location=(-0.01 * scale, 0, z))
    inner = bpy.context.object
    mod = outer.modifiers.new("Aus", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = inner
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier="Aus")
    bpy.data.objects.remove(inner)
    smooth(outer, 0.006, 2)
    assign(outer, mat)
    star_mesh("Stern", 5, 0.17 * scale, 0.07 * scale, depth, z - depth / 2, mat, rotation=math.pi / 10 + math.pi / 2)
    bpy.data.objects["Stern"].location.x = 0.3 * scale


# --------------------------------------------------------------------------
# Teile


def medallion(tone_name, color):
    scene = reset()
    camera(scene, 256, 256, 2.36)
    b = brass()
    torus(1.0, 0.1, 0.02, b)
    disk(1.02, 0.08, -0.04, dark_metal())
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=96, ring_count=48, location=(0, 0, -0.02))
    dome = bpy.context.object
    dome.scale = (0.9, 0.9, 0.14)
    smooth(dome)
    assign(dome, enamel(f"Emaille {tone_name}", color))
    beads(0.84, 40, 0.018, 0.1, b)
    render(scene, f"medaillon-{tone_name}")


def portrait_frame():
    scene = reset()
    camera(scene, 256, 300, 2.62)
    b = brass()
    torus(1.0, 0.075, 0.0, b, scale=(1.0, 1.18, 1.0))
    torus(0.9, 0.03, 0.02, b, scale=(1.0, 1.18, 1.0))
    beads(0.955, 64, 0.02, 0.05, b, scale=(1.0, 1.18))
    # Krone aus drei Kugeln oben
    for x, r in ((-0.09, 0.035), (0, 0.05), (0.09, 0.035)):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, 1.2, 0.06))
        smooth(bpy.context.object)
        assign(bpy.context.object, b)
    render(scene, "rahmen-portraet")


def wax_seal():
    scene = reset()
    camera(scene, 256, 256, 2.3)
    w = wax()
    import bmesh

    mesh = bpy.data.meshes.new("Wachs")
    blob = bpy.data.objects.new("Wachs", mesh)
    bpy.context.collection.objects.link(blob)
    bm = bmesh.new()
    ring = []
    for k in range(160):
        a = 2 * math.pi * k / 160
        r = 0.86 + 0.05 * math.sin(5 * a + 1) + 0.035 * math.sin(9 * a + 2) + 0.02 * math.sin(14 * a + 0.5)
        ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), -0.07)))
    face = bm.faces.new(ring)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, 0, 0.14))
    bm.to_mesh(mesh)
    bm.free()
    bpy.context.view_layer.objects.active = blob
    smooth(blob, 0.065, 8)
    assign(blob, w)
    # eingedrückte Prägefläche und Relief
    torus(0.64, 0.03, 0.075, w)
    crescent_star(0.08, 0.05, w, scale=1.05)
    render(scene, "siegel")


def compass():
    scene = reset()
    camera(scene, 256, 256, 2.4)
    b = brass()
    d = dark_metal()
    torus(1.0, 0.06, 0.0, b)
    disk(1.0, 0.04, -0.05, d)
    torus(0.82, 0.025, 0.0, b)
    for k in range(72):
        a = 2 * math.pi * k / 72
        long = k % 9 == 0
        length = 0.12 if long else 0.06
        r = 0.9
        bpy.ops.mesh.primitive_cube_add(size=1, location=(r * math.cos(a), r * math.sin(a), 0.0))
        tick = bpy.context.object
        tick.scale = (length, 0.008 if not long else 0.014, 0.02)
        tick.rotation_euler.z = a
        assign(tick, b)
    # Windrose: vier lange, vier kurze Spitzen
    star_mesh("Rose lang", 4, 0.8, 0.12, 0.05, 0.0, b)
    star_mesh("Rose kurz", 4, 0.5, 0.1, 0.035, 0.0, d, rotation=math.pi / 4)
    rose_red = enamel("Nordspitze", (0.5, 0.07, 0.05))
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.12, depth=0.7, location=(0, 0.42, 0.06), rotation=(-math.pi / 2, 0, 0))
    north = bpy.context.object
    north.scale = (1, 1, 1)
    north.rotation_euler = (-math.pi / 2, math.pi / 4, 0)
    north.location = (0, 0.45, 0.05)
    assign(north, rose_red)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0, 0.08))
    smooth(bpy.context.object)
    assign(bpy.context.object, b)
    render(scene, "kompass")


def plaque():
    scene = reset()
    camera(scene, 440, 132, 3.34)
    b = brass(tone=(0.88, 0.68, 0.34))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    p = bpy.context.object
    p.scale = (3.2, 0.9, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    smooth(p, 0.05, 5)
    assign(p, b)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.05))
    inner = bpy.context.object
    inner.scale = (3.0, 0.72, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    smooth(inner, 0.02, 3)
    assign(inner, b)
    for x in (-1.46, 1.46):
        for y in (-0.3, 0.3):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(x, y, 0.05))
            smooth(bpy.context.object)
            assign(bpy.context.object, dark_metal())
    render(scene, "plakette")


PARTS = {
    "medaillon": lambda: [
        medallion("rot", (0.42, 0.05, 0.035)),
        medallion("gold", (0.55, 0.33, 0.06)),
        medallion("blau", (0.03, 0.18, 0.2)),
        medallion("dunkel", (0.05, 0.04, 0.035)),
    ],
    "rahmen": portrait_frame,
    "siegel": wax_seal,
    "kompass": compass,
    "plakette": plaque,
}

for key, fn in PARTS.items():
    if not ONLY or key in ONLY:
        fn()
