import { makeShapes } from './shapes.js';

// Standard glTF morph targets keep particle animation on the GPU in Three-Live.
// Split primitives stay below the morph plugin's single-row texture width limit.
export function makeParticleModel(count, fromStage, toStage, paused) {
  const { shapes, seeds } = makeShapes(count);
  const chunks = [], views = [], accessors = [];
  let byteLength = 0;
  function attribute(array, type, bounds = false) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    const offset = byteLength;
    chunks.push(bytes);
    byteLength += bytes.byteLength;
    const view = views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength }) - 1;
    const components = { SCALAR: 1, VEC3: 3, VEC4: 4 }[type];
    const acc = { bufferView: view, componentType: 5126, count: array.length / components, type };
    if (bounds) {
      acc.min = Array(components).fill(Infinity);
      acc.max = Array(components).fill(-Infinity);
      for (let i=0;i<array.length;i++) {
        const k=i%components;
        acc.min[k]=Math.min(acc.min[k],array[i]); acc.max[k]=Math.max(acc.max[k],array[i]);
      }
    }
    return accessors.push(acc)-1;
  }
  const primitives=[];
  // Four triangular faces form a small tetrahedron, rather than a large mesh dot.
  const corners=[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]];
  const faces=[0,2,1,0,1,3,0,3,2,1,2,3];
  for(let start=0;start<count;start+=256) {
    const size=Math.min(256,count-start);
    const position=new Float32Array(size*36);
    const color=new Float32Array(size*36);
    const targets=Array.from({length:3},()=>new Float32Array(size*36));
    for(let local=0;local<size;local++) {
      const i=start+local,j=i*3,seed=seeds[i];
      const source=shapes[paused?toStage:fromStage], target=shapes[toStage];
      const radius=0.008+seed*0.012;
      const length=Math.hypot(source[j],source[j+1],source[j+2])||1;
      for(let v=0;v<12;v++) for(let k=0;k<3;k++) {
        const index=local*36+v*3+k;
        position[index]=source[j+k]+corners[faces[v]][k]*radius;
        targets[0][index]=target[j+k]-source[j+k];
        targets[1][index]=Math.sin(seed*40+k*2.1)*0.065;
        targets[2][index]=source[j+k]/length*(0.1+seed*0.25);
        color[index]=[0.25+seed*0.25,0.48+seed*0.24,0.8+seed*0.18][k];
      }
    }
    primitives.push({
      attributes:{POSITION:attribute(position,'VEC3',true),COLOR_0:attribute(color,'VEC3')},
      targets:targets.map(t=>({POSITION:attribute(t,'VEC3',true)})), material:0
    });
  }
  const times=[],weights=[],rotations=[];
  // Long idle section avoids a visible animation wrap while the viewer is open.
  const duration=120, steps=duration*20;
  for(let i=0;i<=steps;i++) {
    const t=i/20,linear=Math.min(t/1.8,1),ease=linear*linear*(3-2*linear);
    times.push(t);
    weights.push(paused?0:ease,paused?0:Math.sin(t*0.7),paused?0:Math.sin(ease*Math.PI));
    const angle=paused?0:Math.sin(t*0.15)*0.22;
    rotations.push(0,Math.sin(angle/2),0,Math.cos(angle/2));
  }
  const input=attribute(new Float32Array(times),'SCALAR',true);
  const weightOutput=attribute(new Float32Array(weights),'SCALAR');
  const rotationOutput=attribute(new Float32Array(rotations),'VEC4');
  const gltf={
    asset:{version:'2.0',generator:'Portfolio GPU particle adapter for Three-Live'},
    scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'Portfolio particles'}],
    meshes:[{primitives,weights:[0,0,0]}],
    materials:[{doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[0.32,0.58,0.9,1],metallicFactor:0,roughnessFactor:1},extensions:{KHR_materials_unlit:{}}}],
    extensionsUsed:['KHR_materials_unlit'],
    animations:[{name:'Particle morph',samplers:[
      {input,output:weightOutput,interpolation:'LINEAR'},
      {input,output:rotationOutput,interpolation:'LINEAR'}],
      channels:[{sampler:0,target:{node:0,path:'weights'}},{sampler:1,target:{node:0,path:'rotation'}}]}],
    buffers:[{byteLength}],bufferViews:views,accessors
  };
  const json=new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLength=(json.length+3)&~3;
  const total=12+8+jsonLength+8+byteLength;
  const buffer=new ArrayBuffer(total),data=new DataView(buffer),bytes=new Uint8Array(buffer);
  data.setUint32(0,0x46546c67,true);data.setUint32(4,2,true);data.setUint32(8,total,true);
  data.setUint32(12,jsonLength,true);data.setUint32(16,0x4e4f534a,true);
  bytes.fill(32,20,20+jsonLength);bytes.set(json,20);
  const binHeader=20+jsonLength;
  data.setUint32(binHeader,byteLength,true);data.setUint32(binHeader+4,0x004e4942,true);
  let offset=binHeader+8;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return buffer;
}
