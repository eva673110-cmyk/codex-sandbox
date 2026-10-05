import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files=Object.fromEntries(['index.html','app.js','model.js','data.js','cloud.js','config.js','sw.js','style.css'].map(file=>['/'+file,file]));files['/']='index.html';
http.createServer(async(req,res)=>{const file=files[req.url.split('?')[0]];if(!file){res.writeHead(404);res.end();return;}try{const data=await readFile(new URL(file,import.meta.url));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(500);res.end();}}).listen(5173,'127.0.0.1',()=>console.log('Демо: http://127.0.0.1:5173'));
