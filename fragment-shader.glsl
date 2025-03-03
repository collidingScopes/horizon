precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// UI Parameters
uniform float u_speed;
uniform float u_iterations;
uniform float u_scale;
uniform float u_dotFactor;
uniform float u_vOffset;
uniform float u_intensityFactor;
uniform float u_expFactor;
uniform vec3 u_colorFactors;
uniform float u_colorShift;

// Pseudo-random function for noise generation
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 r = u_resolution;
    vec2 FC = gl_FragCoord.xy;
    float time = u_time * u_speed;
    
    // vec2 p=(FC.xy*2.-r)/r.y,l,v=p*(1.-(l+=abs(.7-dot(p,p))))/.2;
    vec2 p = (FC.xy*2.0-r)/r.y;
    vec2 l = vec2(0.0);
    float dotP = dot(p, p);
    l.x += abs(u_dotFactor-dotP);
    vec2 v = p*(1.0-l.x)/u_scale;
    
    // for(float i;i++<8.;o+=(sin(v.xyyx)+1.)*abs(v.x-v.y)*.2)v+=cos(v.yx*i+vec2(0,i)+time)/i+.7;
    vec4 o = vec4(0.0);
    for(float i = 0.0; i < 16.0; i++) {
        if (i >= u_iterations) break;
        float idx = i + 1.0; // i++ starts at 1
        v += cos(v.yx*idx+vec2(0.0,idx)+time)/idx+u_vOffset;
        o += (sin(vec4(v.x,v.y,v.y,v.x))+1.0)*abs(v.x-v.y)*u_intensityFactor;
    }
    
    // Apply color shift if requested
    if (u_colorShift > 0.0) {
        o = o.wxyz * u_colorShift + o * (1.0 - u_colorShift);
    }
    
    // o=tanh(exp(p.y*vec4(1,-1,-2,0))*exp(-4.*l.x)/o);
    // Implement tanh manually since it's not available in all GLSL versions
    vec4 expPy = exp(p.y*vec4(u_colorFactors.x, u_colorFactors.y, u_colorFactors.z, 0.0));
    float expLx = exp(-u_expFactor*l.x);
    vec4 ratio = expPy*expLx/o;
    
    // tanh(x) = (exp(2x) - 1) / (exp(2x) + 1)
    vec4 exp2x = exp(2.0 * ratio);
    o = (exp2x - 1.0) / (exp2x + 1.0);
    
    // Add film grain
    vec2 noiseCoord = FC / 1.5;
    float noise = random(noiseCoord + time * 0.001) * 0.12 - 0.075;

    // Apply film grain and effects
    o = o + vec4(noise);
    
    // Clamp values to avoid artifacts
    o = clamp(o, 0.0, 1.0);
    
    gl_FragColor = o;
}