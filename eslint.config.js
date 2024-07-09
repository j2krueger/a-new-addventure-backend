import mochaPlugin from 'eslint-plugin-mocha';

export default [
    mochaPlugin.configs.flat.recommended // or `mochaPlugin.configs.flat.all` to enable all
    // ... Your configurations here
];