var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class FingerprintSpoofer {
  // Declare chrome variable
  constructor(chrome) {
    __publicField(this, "settings");
    __publicField(this, "sessionSeed");
    __publicField(this, "chrome");
    this.chrome = chrome;
    this.sessionSeed = Math.random();
    this.settings = {
      canvasNoise: true,
      webglSpoofing: true,
      audioDistortion: true,
      userAgentRotation: false,
      timezoneRandomization: true
    };
    this.loadSettings();
    this.initializeSpoofers();
  }
  async loadSettings() {
    try {
      const result = await this.chrome.storage.sync.get("ghostModeSettings");
      if (result.ghostModeSettings) {
        this.settings = { ...this.settings, ...result.ghostModeSettings };
      }
    } catch (error) {
      console.error("Failed to load spoofing settings:", error);
    }
  }
  initializeSpoofers() {
    if (this.settings.canvasNoise) {
      this.spoofCanvas();
    }
    if (this.settings.webglSpoofing) {
      this.spoofWebGL();
    }
    if (this.settings.audioDistortion) {
      this.spoofAudio();
    }
    if (this.settings.timezoneRandomization) {
      this.spoofTimezone();
    }
  }
  spoofCanvas() {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      const ctx = this.getContext("2d");
      if (ctx) {
        fingerprintSpoofer.addCanvasNoise(ctx, this.width, this.height);
      }
      return originalToDataURL.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.getImageData = function(...args) {
      const imageData = originalGetImageData.apply(this, args);
      fingerprintSpoofer.addImageDataNoise(imageData);
      return imageData;
    };
  }
  addCanvasNoise(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (this.getSeededRandom() - 0.5) * 2;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  }
  addImageDataNoise(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (this.getSeededRandom() - 0.5) * 1;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
  spoofWebGL() {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(pname) {
      const result = originalGetParameter.call(this, pname);
      switch (pname) {
        case this.RENDERER:
          return fingerprintSpoofer.getSpoofedRenderer();
        case this.VENDOR:
          return fingerprintSpoofer.getSpoofedVendor();
        case this.VERSION:
          return fingerprintSpoofer.getSpoofedVersion();
        case this.SHADING_LANGUAGE_VERSION:
          return fingerprintSpoofer.getSpoofedShadingVersion();
        default:
          return result;
      }
    };
  }
  getSpoofedRenderer() {
    const renderers = [
      "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8681)",
      "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)",
      "ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.1020.2002)"
    ];
    const index = Math.floor(this.getSeededRandom() * renderers.length);
    return renderers[index];
  }
  getSpoofedVendor() {
    const vendors = ["Google Inc. (Intel)", "Google Inc. (NVIDIA)", "Google Inc. (AMD)"];
    const index = Math.floor(this.getSeededRandom() * vendors.length);
    return vendors[index];
  }
  getSpoofedVersion() {
    const versions = [
      "OpenGL ES 2.0 (ANGLE 2.1.0.d46e2fb1e341)",
      "OpenGL ES 2.0 (ANGLE 2.1.0.f18e2fb1e341)",
      "OpenGL ES 2.0 (ANGLE 2.1.0.a26e2fb1e341)"
    ];
    const index = Math.floor(this.getSeededRandom() * versions.length);
    return versions[index];
  }
  getSpoofedShadingVersion() {
    return "OpenGL ES GLSL ES 1.0 (ANGLE 2.1.0.d46e2fb1e341)";
  }
  spoofAudio() {
    const originalCreateOscillator = AudioContext.prototype.createOscillator;
    const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createOscillator = function() {
      const oscillator = originalCreateOscillator.call(this);
      const originalStart = oscillator.start;
      oscillator.start = function(when) {
        if (oscillator.frequency) {
          const variation = fingerprintSpoofer.getSeededRandom() * 0.1 - 0.05;
          oscillator.frequency.value *= 1 + variation;
        }
        return originalStart.call(this, when);
      };
      return oscillator;
    };
    AudioContext.prototype.createAnalyser = function() {
      const analyser = originalCreateAnalyser.call(this);
      const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
      analyser.getFloatFrequencyData = function(array) {
        originalGetFloatFrequencyData.call(this, array);
        for (let i = 0; i < array.length; i++) {
          const noise = (fingerprintSpoofer.getSeededRandom() - 0.5) * 0.1;
          array[i] += noise;
        }
      };
      return analyser;
    };
  }
  spoofTimezone() {
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function() {
      const originalOffset = originalGetTimezoneOffset.call(this);
      const variation = Math.floor(fingerprintSpoofer.getSeededRandom() * 120 - 60);
      return originalOffset + variation;
    };
  }
  getSeededRandom() {
    this.sessionSeed = (this.sessionSeed * 9301 + 49297) % 233280;
    return this.sessionSeed / 233280;
  }
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.chrome.storage.sync.set({ ghostModeSettings: this.settings });
  }
  getSettings() {
    return { ...this.settings };
  }
}
const fingerprintSpoofer = new FingerprintSpoofer(window.chrome);
window.fingerprintSpoofer = fingerprintSpoofer;
