"""Class-byte descriptors/debug coordinates, not Java type attribution.
Open Questions: evidence/G01-COMPILED-METHOD-COORDINATES-R1.json.
"""
import struct


class Reader:
    def __init__(self, data):
        self.data, self.offset = data, 0

    def take(self, n):
        if n < 0 or self.offset + n > len(self.data):
            raise ValueError('method-class.truncated')
        out = self.data[self.offset:self.offset + n]
        self.offset += n
        return out

    def u1(self):
        return self.take(1)[0]

    def u2(self):
        return struct.unpack('>H', self.take(2))[0]

    def u4(self):
        return struct.unpack('>I', self.take(4))[0]

    def finish(self):
        if self.offset != len(self.data):
            raise ValueError('method-class.trailing')


def descriptor_arity(value):
    if not isinstance(value, str) or not value.startswith('('):
        raise ValueError('method-class.descriptor')
    i, count = 1, 0

    def field(index):
        while index < len(value) and value[index] == '[':
            index += 1
        if index >= len(value):
            raise ValueError('method-class.descriptor')
        if value[index] in 'BCDFIJSZ':
            return index + 1
        if value[index] == 'L':
            end = value.find(';', index + 1)
            if end > index + 1:
                return end + 1
        raise ValueError('method-class.descriptor')

    while i < len(value) and value[i] != ')':
        i = field(i)
        count += 1
    if i >= len(value) or i + 1 >= len(value):
        raise ValueError('method-class.descriptor')
    i += 1
    end = i + 1 if value[i] == 'V' else field(i)
    if end != len(value):
        raise ValueError('method-class.descriptor')
    return count


def parse_class(data):
    r = Reader(data)
    if r.u4() != 0xcafebabe:
        raise ValueError('method-class.header')
    r.take(4)
    pool = [None] * r.u2()
    i = 1
    while i < len(pool):
        tag = r.u1()
        if tag == 1:
            # Keep arbitrary modified-UTF8 strings opaque. Decode only identity
            # fields as ASCII; unsupported non-ASCII identity fails explicitly.
            pool[i] = ('utf8', r.take(r.u2()))
        elif tag == 7:
            pool[i] = ('class', r.u2())
        elif tag in (3, 4, 9, 10, 11, 12, 17, 18):
            r.take(4)
        elif tag in (5, 6):
            r.take(8)
            i += 1
        elif tag in (8, 16, 19, 20):
            r.take(2)
        elif tag == 15:
            r.take(3)
        else:
            raise ValueError('method-class.constant-tag')
        i += 1

    def text(index):
        if not 0 < index < len(pool) or pool[index] is None or pool[index][0] != 'utf8':
            raise ValueError('method-class.utf8-reference')
        return pool[index][1].decode('ascii', errors='strict')

    def attrs(reader):
        return [(text(reader.u2()), reader.take(reader.u4())) for _ in range(reader.u2())]

    access, this = r.u2(), r.u2()
    if not 0 < this < len(pool) or pool[this] is None or pool[this][0] != 'class':
        raise ValueError('method-class.class-reference')
    name = text(pool[this][1])
    r.u2()
    r.take(r.u2() * 2)
    for _ in range(r.u2()):
        r.take(6)
        attrs(r)
    methods, seen = [], set()
    for _ in range(r.u2()):
        flags, method_name, desc = r.u2(), text(r.u2()), text(r.u2())
        arity = descriptor_arity(desc)
        if (method_name, desc) in seen:
            raise ValueError('method-class.duplicate-method')
        seen.add((method_name, desc))
        lines, code_seen = [], False
        for kind, payload in attrs(r):
            if kind != 'Code':
                continue
            if code_seen:
                raise ValueError('method-class.duplicate-code')
            code_seen = True
            code = Reader(payload)
            code.take(4)
            size = code.u4()
            code.take(size)
            code.take(code.u2() * 8)
            for attr, content in attrs(code):
                if attr != 'LineNumberTable':
                    continue
                table = Reader(content)
                for _ in range(table.u2()):
                    pc, number = table.u2(), table.u2()
                    if pc >= size or number == 0:
                        raise ValueError('method-class.line-coordinate')
                    lines.append({'start_pc': pc, 'line': number})
                table.finish()
            code.finish()
        methods.append({'name': method_name, 'descriptor': desc, 'access_flags': flags,
                        'arity': arity, 'has_code': code_seen, 'line_table': lines})
    source_files = [value for key, value in attrs(r) if key == 'SourceFile']
    if len(source_files) > 1 or source_files and len(source_files[0]) != 2:
        raise ValueError('method-class.source-file')
    source = text(struct.unpack('>H', source_files[0])[0]) if source_files else None
    r.finish()
    return {'name': name, 'access_flags': access, 'source_filename': source, 'methods': methods}


def associate_method(binary_name, compiled, record):
    """Unique named-class/name/arity/all-debug-lines association only.
    Generated methods and compiler constructor prefixes remain unresolved.
    """
    if compiled['access_flags'] & (0x1000 | 0x40) or compiled['name'] == '<clinit>':
        return {'status': 'generated-or-initializer', 'source_method_id': None}
    lines = [x['line'] for x in compiled['line_table']]
    if not lines:
        return {'status': 'debug-lines-unavailable', 'source_method_id': None}
    classes = {c['entity_id']: c for c in record['classes']}

    def chain(identity):
        names, visited = [], set()
        while identity is not None:
            if identity in visited or identity not in classes:
                raise ValueError('method-class.source-class-chain')
            visited.add(identity)
            cls = classes[identity]
            if not cls['name']:
                return None
            names.append(cls['name'])
            identity = cls['parent_class_id']
        return '$'.join(reversed(names))

    class_simple = binary_name.rsplit('/', 1)[-1]
    candidates = [m for m in record['methods'] if m['has_body'] and m['name'] == compiled['name']
                  and len(m['parameter_types_syntax']) == compiled['arity']
                  and chain(m['owner_class_id']) == class_simple
                  and m['span']['complete']
                  and all(m['span']['start_line'] <= n <= m['span']['end_line'] for n in lines)]
    return {'status': 'unique-coordinate-association' if len(candidates) == 1 else 'ambiguous-or-unmatched',
            'source_method_id': candidates[0]['entity_id'] if len(candidates) == 1 else None,
            'candidate_count': len(candidates), 'type_attributed_signature': False}
