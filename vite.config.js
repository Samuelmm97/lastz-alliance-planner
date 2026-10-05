import { defineConfig } from 'vite';
import {execFileSync} from 'node:child_process';
let version='development';try{version=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim();}catch{}
export default defineConfig({base:'./',define:{__APP_VERSION__:JSON.stringify(version)}});
