shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled;
uniform float opacity = 0.18;
void fragment() {
    float d = length((UV - vec2(0.5)) * 2.0);
    ALBEDO = vec3(0.20, 0.17, 0.13);
    ALPHA = (1.0 - smoothstep(0.0, 1.0, d)) * opacity;
}
