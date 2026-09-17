import {spawn} from 'node:child_process';
import {readFile,stat,writeFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {packLayout,crc32} from './package-layout.mjs';
const dist=new URL('../../apps/esp32/dist/',import.meta.url);
let flash={running:false,output:'',error:null},flashPort='';
function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{windowsHide:true});let output='';child.stdout.on('data',b=>{output=(output+b).slice(-8000);if(flash.running)flash.output=output;});child.stderr.on('data',b=>{output=(output+b).slice(-8000);if(flash.running)flash.output=output;});child.on('error',reject);child.on('close',code=>code===0?resolve(output):reject(new Error(output||'命令失败 '+code)));});}
function deviceUrl(base,path){const url=new URL(base);if(url.protocol!=='http:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('填写设备 HTTP 地址，例如 http://192.168.1.50');const p=url.hostname.split('.').map(Number);if(!(['localhost','127.0.0.1'].includes(url.hostname)||p.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&(p[0]===10||p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31)))throw new Error('设备地址需为本机或局域网 IPv4 地址');return new URL(path,url);}
export function nextLayoutSlot(slots){
 if(slots.length!==65536)throw new Error('布局分区读取不完整');let active=-1,generation=0;
 for(let i=0;i<2;i++){const slot=slots.subarray(i*32768,(i+1)*32768),length=slot.readUInt32LE(4),gen=slot.readUInt32LE(32764);if(slot.subarray(0,4).toString()==='OUI2'&&length>=6&&length<=28656&&slot.readUInt32LE(12)===1&&crc32(slot.subarray(16,16+length))===slot.readUInt32LE(8)&&(active<0||gen>generation)){active=i;generation=gen;}}
 if(generation===0xffffffff)throw new Error('设备布局版本号已达上限');
 return {address:active===0?'0x3e8000':'0x3e0000',generation:generation+1};
}
async function device(base,path,options={}){const res=await fetch(deviceUrl(base,path),{...options,redirect:'error',signal:AbortSignal.timeout(15000)});const body=await res.text();if(!res.ok)throw new Error(res.status===404?'当前固件不支持布局部署，请先烧录基础运行时':`设备 HTTP ${res.status}: ${body.slice(0,200)}`);return JSON.parse(body);}
export async function deployRoute(req,res,url){
 if(!url.pathname.startsWith('/api/deploy/'))return false;
 const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try{
  if(req.method==='GET'&&url.pathname==='/api/deploy/flash'){reply(200,flash);return true;}
  if(req.method==='GET'&&url.pathname==='/api/deploy/ports'){const output=await run('python',['-c','import json,serial.tools.list_ports; print(json.dumps([{"port":p.device,"name":p.description} for p in serial.tools.list_ports.comports()]))']);reply(200,{ports:JSON.parse(output)});return true;}
  if(req.method==='GET'&&url.pathname==='/api/deploy/device'){reply(200,await device(url.searchParams.get('address'),'/ui/capabilities'));return true;}
  if(req.method!=='POST'){reply(405,{error:'POST required'});return true;}
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>128*1024)throw new Error('请求超过 128 KiB');chunks.push(chunk);}
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(url.pathname==='/api/deploy/package'){const data=packLayout(input.document);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="operit-ui.oui"','Cache-Control':'no-store'});res.end(data);return true;}
  if(url.pathname==='/api/deploy/layout'){
   const data=packLayout(input.document),caps=await device(input.address,'/ui/capabilities');if(caps.protocol!==1||caps.board!=='ESP32-2432S028'||caps.maxPackageBytes<data.length)throw new Error('设备运行时或布局包规格不匹配');
   const result=await device(input.address,'/ui/package',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Operit-Studio':'1',Authorization:'Bearer '+(input.token||'')},body:data});
   reply(200,{...result,bytes:data.length,previousRevision:caps.revision});return true;
  }
  if(['/api/deploy/flash','/api/deploy/usb-layout'].includes(url.pathname)){
   if(flash.running)throw new Error('正在烧录，请等待完成');
   const output=await run('python',['-c','import json,serial.tools.list_ports; print(json.dumps([p.device for p in serial.tools.list_ports.comports()]))']);if(!JSON.parse(output).includes(input.port))throw new Error('串口已断开，请刷新串口列表');
   if(flash.running)throw new Error('另一项串口任务已开始，请等待完成');
   if(url.pathname.endsWith('usb-layout')){
    const packet=packLayout(input.document),image=Buffer.alloc(32768,255);image.set(packet);
    const prefix=path.join(tmpdir(),'operit-ui-'+randomUUID()),tableFile=prefix+'.table',packageFile=prefix+'.bin',slotsFile=prefix+'.slots';
    const port=input.port;
    flash={running:true,output:'正在检查设备分区并下发 USB 布局（无需编译）',error:null};
    (async()=>{try{
     const common=['--chip','esp32','--port',port,'--baud','460800','--skip-update-check','--non-interactive'];
     await run('espflash',['read-flash',...common,'0x8000','0xc00',tableFile]);
     const table=await readFile(tableFile);let compatible=false;
     for(let i=0;i+32<=table.length;i+=32)if(table.readUInt16LE(i)===0x50aa&&table.subarray(i+12,i+28).toString().replace(/\0/g,'')==='ui_layout'&&table.readUInt32LE(i+4)===0x3e0000&&table.readUInt32LE(i+8)===65536)compatible=true;
     if(!compatible)throw new Error('设备未安装支持布局分区的基础运行时，请先烧录基础固件');
     await run('espflash',['read-flash',...common,'0x3e0000','0x10000',slotsFile]);
     const {address,generation}=nextLayoutSlot(await readFile(slotsFile));image.writeUInt32LE(generation,32764);
     await writeFile(packageFile,image);await run('espflash',['write-bin',...common,address,packageFile]);
     flash.output=`USB 布局下发完成 · ${packet.length} 字节布局 · 设备已重启；未编译、未改动程序和 Wi-Fi 分区`;
    }catch(e){flash.error=e.message;}finally{await Promise.all([unlink(tableFile).catch(()=>{}),unlink(packageFile).catch(()=>{}),unlink(slotsFile).catch(()=>{})]);flash.running=false;}})();
    reply(202,flash);return true;
   }
   const files=[['0x1000','bootloader.bin'],['0x8000','partition-table.bin'],['0x10000','operit-esp32.bin']];for(const [,file] of files)await stat(new URL(file,dist));
   // Validate the new data partition exists before allowing runtime deployment.
   if(!(await readFile(new URL('partition-table.bin',dist))).includes(Buffer.from('ui_layout')))throw new Error('基础运行时产物尚未更新，请由开发者构建一次后再烧录');
   if(flash.running)throw new Error('另一项串口任务已开始，请等待完成');
   flashPort=input.port;flash={running:true,output:'正在烧录现成基础固件（不启动编译）',error:null};
   (async()=>{try{for(const [address,file] of files)await run('espflash',['write-bin','--chip','esp32','--port',flashPort,'--baud','460800','--skip-update-check','--non-interactive',address,fileURLToPath(new URL(file,dist))]);flash.output='基础运行时烧录完成；连接设备 Wi-Fi 后可直接部署布局';}catch(e){flash.error=e.message;}finally{flash.running=false;}})();reply(202,flash);return true;
  }
  reply(404,{error:'Unknown deployment action'});
 }catch(e){reply(400,{error:e.message});}
 return true;
}
