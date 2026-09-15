import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.service.ts",
    "src/**/*.controller.ts",
    "!src/**/*.d.ts",
  ],
};

export default config;
