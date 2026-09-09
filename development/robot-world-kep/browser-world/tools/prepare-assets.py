"""Create browser derivatives; preserve mesh topology and all frozen source bytes.

Deduplicate embedded PNG images, encode 8-bit JPEG base maps and lossless PNG
data maps, and repack geometry-only GLBs with shared relative texture URIs.
Open questions: ../PLAN.md#open-questions, BQ2.
"""
import hashlib
import io
import json
import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'unity-ui/unity/Assets/RobotWorld/Models/ColonyV2'
DEST = ROOT / 'app/public/assets/colony-v1'

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def run():
    if DEST.exists():
        raise SystemExit('Derivative revision already exists; choose a new revision before changing assets.')
    (DEST / 'models').mkdir(parents=True)
    (DEST / 'models/textures').mkdir()
    textures = {}
    records = []
    total_source = 0
    for path in sorted(SOURCE.glob('*.glb')):
        raw = path.read_bytes()
        total_source += len(raw)
        magic, version, total = struct.unpack_from('<III', raw)
        assert magic == 0x46546c67 and version == 2 and total == len(raw)
        json_len, chunk_type = struct.unpack_from('<II', raw, 12)
        assert chunk_type == 0x4e4f534a
        gltf = json.loads(raw[20:20 + json_len])
        bin_len, bin_type = struct.unpack_from('<II', raw, 20 + json_len)
        assert bin_type == 0x004e4942
        binary = raw[28 + json_len:28 + json_len + bin_len]
        image_views = set()
        for img in gltf.get('images', []):
            idx = img['bufferView']
            image_views.add(idx)
            view = gltf['bufferViews'][idx]
            start = view.get('byteOffset', 0)
            data = binary[start:start + view['byteLength']]
            key = sha(data)
            if key not in textures:
                decoded = Image.open(io.BytesIO(data)).convert('RGB')
                decoded.thumbnail((512, 512), Image.Resampling.LANCZOS)
                base = img.get('name', '').endswith('-base')
                ext = 'jpg' if base else 'png'
                filename = key[:16] + '.' + ext
                encoded = io.BytesIO()
                if base:
                    decoded.save(encoded, format='JPEG', quality=90, subsampling=0, optimize=True)
                else:
                    decoded.save(encoded, format='PNG', optimize=True)
                output = encoded.getvalue()
                (DEST / 'models/textures' / filename).write_bytes(output)
                textures[key] = {'source_image_sha256': key, 'name': img.get('name'), 'path': 'models/textures/' + filename, 'sha256': sha(output), 'bytes': len(output), 'width': decoded.width, 'height': decoded.height, 'decoded_rgba_mip_bytes_estimate': round(decoded.width * decoded.height * 4 * 4 / 3)}
            img.pop('bufferView')
            img.pop('mimeType', None)
            img['uri'] = textures[key]['path'].removeprefix('models/')
        new_views = []
        mapping = {}
        payload = bytearray()
        for i, view in enumerate(gltf['bufferViews']):
            if i in image_views:
                continue
            while len(payload) % 4:
                payload.append(0)
            v = dict(view)
            start = v.get('byteOffset', 0)
            data = binary[start:start + v['byteLength']]
            v['byteOffset'] = len(payload)
            v['buffer'] = 0
            mapping[i] = len(new_views)
            new_views.append(v)
            payload.extend(data)
        for a in gltf['accessors']:
            if 'bufferView' in a:
                a['bufferView'] = mapping[a['bufferView']]
            assert 'sparse' not in a, 'Sparse accessor needs an explicit converter'
        gltf['bufferViews'] = new_views
        gltf['buffers'] = [{'byteLength': len(payload)}]
        gltf.setdefault('asset', {})['generator'] = 'Robot World browser derivative v1; unchanged mesh topology'
        js = json.dumps(gltf, separators=(',', ':')).encode()
        js += b' ' * (-len(js) % 4)
        payload.extend(b'\x00' * (-len(payload) % 4))
        result = struct.pack('<III', 0x46546c67, 2, 28 + len(js) + len(payload)) + struct.pack('<II', len(js), 0x4e4f534a) + js + struct.pack('<II', len(payload), 0x004e4942) + payload
        (DEST / 'models' / path.name).write_bytes(result)
        records.append({'id': path.stem, 'source': str(path.relative_to(ROOT.parent)), 'source_sha256': sha(raw), 'source_bytes': len(raw), 'path': 'models/' + path.name, 'sha256': sha(result), 'bytes': len(result), 'meshes': len(gltf['meshes']), 'geometry_change': 'none'})
    assert len(records) == 7
    manifest = {'schema_version': 'robot-world.browser-assets/v1-prototype', 'source_glb_bytes': total_source, 'served_model_bytes': sum(r['bytes'] for r in records), 'served_texture_bytes': sum(t['bytes'] for t in textures.values()), 'models': records, 'textures': list(textures.values()), 'open_questions': '../../../../PLAN.md#open-questions', 'claim_ceiling': 'Browser derivatives only; visual acceptance requires rendered evidence.'}
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    session = ROOT.parent / 'unity-ui/unity/Assets/StreamingAssets/RobotWorld/demo-session'
    dest_session = ROOT / 'app/public/session'
    dest_session.mkdir(parents=True, exist_ok=False)
    for name in ['session.json', 'session-manifest.json']:
        (dest_session / name).write_bytes((session / name).read_bytes())
    print(json.dumps({k: v for k, v in manifest.items() if k not in ('models', 'textures')}, indent=2))

if __name__ == '__main__':
    run()
