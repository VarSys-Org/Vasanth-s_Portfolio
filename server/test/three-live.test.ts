import { describe, expect, it } from "vitest";
// @ts-expect-error The browser experiment is plain JavaScript outside the server TypeScript project.
import { makeParticleModel } from "../../public/experiments/three-live/particle-model.js";

describe("makeParticleModel GLB output", () => {
  it("writes valid chunk lengths and accessors contained by their buffer views", () => {
    const buffer = makeParticleModel(300, 0, 1, false);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    const jsonLength = view.getUint32(12, true);
    const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
    const components: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe("glTF");
    expect(view.getUint32(8, true)).toBe(buffer.byteLength);
    expect(jsonLength % 4).toBe(0);
    const binaryHeader = 20 + jsonLength;
    const binaryLength = view.getUint32(binaryHeader, true);
    expect(binaryLength % 4).toBe(0);
    expect(binaryHeader + 8 + binaryLength).toBe(buffer.byteLength);
    for (const accessor of gltf.accessors) {
      expect(accessor.count * components[accessor.type] * 4).toBeLessThanOrEqual(gltf.bufferViews[accessor.bufferView].byteLength);
    }
  });
});
