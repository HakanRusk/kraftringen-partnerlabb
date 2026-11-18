import {spawn} from 'node:child_process';
const args=process.argv.slice(2), value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const child=spawn('python',['-m','http.server',value('--port','4173'),'--bind',value('--host','127.0.0.1'),'--directory','dist'],{stdio:'inherit'});
process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code||0));
