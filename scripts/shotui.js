// Поиск «кнопочных» прямоугольников на скриншоте меню Luanti (тёмная тема).
// node shotui.png [--box x0,y0,x1,y1]
const fs=require('fs'), zlib=require('zlib');
function decode(p){const b=fs.readFileSync(p);let pos=8,w=0,h=0,ctype=0,idat=[];
 while(pos<b.length){const len=b.readUInt32BE(pos),type=b.toString('ascii',pos+4,pos+8);const data=b.subarray(pos+8,pos+8+len);
  if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);ctype=data[9];}else if(type==='IDAT')idat.push(data);pos+=12+len;}
 const bpp=ctype===6?4:ctype===2?3:1;const raw=zlib.inflateSync(Buffer.concat(idat));const stride=w*bpp,out=Buffer.alloc(h*stride);let o=0;
 for(let y=0;y<h;y++){const f=raw[o++];const line=raw.subarray(o,o+stride);o+=stride;const cur=out.subarray(y*stride,(y+1)*stride);const prev=y?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
  for(let x=0;x<stride;x++){const a=x>=bpp?cur[x-bpp]:0,b0=prev[x],c=x>=bpp?prev[x-bpp]:0;let v=line[x];
   if(f===1)v+=a;else if(f===2)v+=b0;else if(f===3)v+=(a+b0)>>1;else if(f===4){const pp=a+b0-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b0),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b0:c);}cur[x]=v&255;}}
 return{w,h,bpp,px:out};}
const img=decode(process.argv[2]);
let box=null; const bidx=process.argv.indexOf('--box'); if(bidx>0){box=process.argv[bidx+1].split(',').map(Number);}
const {w,h,bpp,px}=img;
// маска «кнопка»: светлее фона, средне-насыщенная тёмно-серая плашка (Luanti skin ~ (80..120))
function face(x,y){const i=(y*w+x)*bpp;const r=px[i],g=px[i+1],bb=px[i+2];const mx=Math.max(r,g,bb),mn=Math.min(r,g,bb);
 return mx>=70&&mx<=140&&mx-mn<=30;}
// компоненты из face-пикселей (сэмпл шаг 2)
const step=2, seen=new Uint8Array(w*h);
const comps=[];
for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){const id=y*w+x;if(seen[id]||!face(x,y))continue;
 // flood fill очередь
 const q=[[x,y]];seen[id]=1;let n=0,x0=x,x1=x,y0=y,y1=y;
 while(q.length){const [cx,cy]=q.pop();n++;if(cx<x0)x0=cx;if(cx>x1)x1=cx;if(cy<y0)y0=cy;if(cy>y1)y1=cy;
  for(const[dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const nid=ny*w+nx;if(seen[nid])continue;seen[nid]=1;if(face(nx,ny))q.push([nx,ny]);}}
 if(n>=120) comps.push({x0,y0,x1,y1,n});}
comps.sort((a,b)=>a.y0-b.y0||a.x0-b.x0);
for(const c of comps){if(box&&(c.x1<box[0]||c.x0>box[2]||c.y1<box[1]||c.y0>box[3]))continue;
 console.log(`box=[${c.x0},${c.y0}..${c.x1},${c.y1}] center=(${(c.x0+c.x1)>>1},${(c.y0+c.y1)>>1}) px=${c.n}`);}
