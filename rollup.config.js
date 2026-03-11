import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import minifyHTML from 'rollup-plugin-minify-html-literals';

export default [
  {
    input: ["src/energy-distribution-ext.ts"],
    output: [
      {
        dir: "dist",
        format: "es",
        inlineDynamicImports: true
      }
    ],
    plugins: [
      minifyHTML(),
      typescript(),
      nodeResolve(),
      json({
        compact: true
      }),
      commonjs(),
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled"
      })
    ]
  }
];
