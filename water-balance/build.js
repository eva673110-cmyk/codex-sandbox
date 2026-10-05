import {mkdir,copyFile} from 'node:fs/promises';
import {config} from './config.js';
if(process.argv.includes('--production')&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl)||!config.publishableKey.startsWith('sb_publishable_')))throw Error('Для публикации заполните Project URL и публичный publishable key в config.js.');
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
for(const file of ['index.html','style.css','app.js','model.js','data.js','cloud.js','config.js','sw.js','.nojekyll'])await copyFile(new URL(file,import.meta.url),new URL(`dist/${file}`,import.meta.url));
console.log('Статическое демо собрано в dist');
