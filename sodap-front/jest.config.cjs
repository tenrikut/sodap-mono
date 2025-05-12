// jest.config.cjs
module.exports = {
  preset: "ts-jest", // use ts-jest to compile TS/TSX
  testEnvironment: "jsdom", // for React components
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // mirror your tsconfig paths
    "\\.(css|less|sass|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/src/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: [
    "<rootDir>/src/setupTests.ts", // register jest-dom matchers
  ],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json", // point to your TS config
    },
  },
  transformIgnorePatterns: ["/node_modules/(?!(@solana/web3.js))/"],
};
