shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
uniform vec4 tint : source_color = vec4(0.56, 0.48, 0.34, 1.0);
uniform float grain = 0.08;
varying vec3 world_position;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
void vertex() { world_position = (MODEL_MATRIX * vec4(VERTEX,1.0)).xyz; }
void fragment() {
    vec2 p = world_position.xz;
    float patches = noise(p * 1.7) * 0.6 + noise(p * 7.0) * 0.4;
    float fine = hash(floor(p * 160.0));
    float moss = smoothstep(0.48,0.82,noise(p + vec2(3,6))) * smoothstep(0.65,1.4,abs(p.y));
    vec3 soil = mix(tint.rgb,tint.rgb*vec3(0.68,0.80,0.50),moss*0.35);
    ALBEDO = soil * (0.94 + (patches - 0.5) * grain * 3.0 + (fine - 0.5) * grain);
    ROUGHNESS = 0.94;
}
