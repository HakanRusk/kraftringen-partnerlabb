import {cpSync,rmSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
rmSync('runtime/public',{recursive:true,force:true});mkdirSync('runtime/public',{recursive:true});
cpSync('dist','runtime/public',{recursive:true,filter:source=>!/^dist\/(server|client|\.openai)(\/|$)/.test(source)});
cpSync('.openai/hosting.json','runtime/.openai/hosting.json');
const command=process.env.SITES_PNPM_BIN;
const result=command?spawnSync(process.execPath,[command,'run','build'],{cwd:'runtime',stdio:'inherit'}):spawnSync('npm',['run','build'],{cwd:'runtime',stdio:'inherit'});
if(result.error||result.status!==0)process.exit(result.status||1);
for(const dir of ['server','client','.openai']) {rmSync(`dist/${dir}`,{recursive:true,force:true});cpSync(`runtime/dist/${dir}`,`dist/${dir}`,{recursive:true});}
