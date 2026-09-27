import http from'node:http';
import {
  readFile
}from'node:fs/promises';
import path from'node:path';
import {
  fileURLToPath
}from'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4187);
const types= {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'
};
http.createServer(async(req,res)=> {
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));const rel=path.relative(root,target);if(rel.startsWith('..')||path.isAbsolute(rel)) {
      res.writeHead(403);res.end();return;
    }const body=await readFile(target);res.writeHead(200, {
      'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'
    });res.end(body);
  }catch {
    res.writeHead(404);res.end('Not found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`PULSE / BREAK http://127.0.0.1:${port}`));
