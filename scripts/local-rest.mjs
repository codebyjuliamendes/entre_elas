import http from 'node:http';
// Adaptador local: o mesmo prefixo REST do Supabase, sem simular Storage/Auth externos.
const server=http.createServer((request,response)=>{
 if(!request.url?.startsWith('/rest/v1/')){response.writeHead(503,{'Content-Type':'application/json'});response.end(JSON.stringify({erro:'Serviço não disponível no ambiente local.'}));return;}
 const headers={...request.headers,host:'127.0.0.1:54331'};delete headers.apikey;
 const upstream=http.request({hostname:'127.0.0.1',port:54331,path:request.url.slice('/rest/v1'.length),method:request.method,headers},result=>{response.writeHead(result.statusCode ?? 502,result.headers);result.pipe(response);});
 upstream.on('error',()=>{response.writeHead(503);response.end();});request.pipe(upstream);
});
server.listen(54321,'127.0.0.1');
