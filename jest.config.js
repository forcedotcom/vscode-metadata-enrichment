/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/'],
  modulePathIgnorePatterns: ['/lib/', '/dist/'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/test/__mocks__/vscode.ts'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node'
        }
      }
    ]
  },
  clearMocks: true
};
