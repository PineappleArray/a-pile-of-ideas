const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
  module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     roots: ['<rootDir>/UnitTest'],
     testMatch: ['**/*.test.ts'],
     setupFiles: ['<rootDir>/jest.setup.js']
   };
