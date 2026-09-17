import {request} from './transport.js';
import {packLayout} from './package-layout.mjs';
const $=s=>document.querySelector(s);
export function setupDeploy({snapshot,notify}){
 const dialog=$('#deploy-dialog');let timer=null;
 function info(text){$('#deploy-feedback').textContent=text;}
 $('#open-deploy').onclick=()=>{try{const bytes=packLayout(snapshot().document).length;$('#package-size').textContent=`当前项目 ${bytes.toLocaleString()} 字节 · 上限 28 KiB · 页面修改无需编译`;info('下发的是当前草稿；保存项目用于保留可继续编辑的源文件。');}catch(e){info(e.message);}dialog.showModal();};
 $('#deploy-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{clearInterval(timer);timer=null;});
 $('#export-layout').onclick=()=>{const blob=new Blob([JSON.stringify(snapshot().document,null,2)+'\n'],{type:'application/json'});download(blob,'layout.json');};
 $('#export-package').onclick=()=>{try{download(new Blob([packLayout(snapshot().document)]),'operit-ui.oui');info('已导出布局包，不含固件或编译缓存。');}catch(e){info(e.message);}};
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('#connect-device').onclick=async()=>{try{const caps=await request('/api/deploy/device?address='+encodeURIComponent($('#device-address').value));info(`已连接 ${caps.board} · 布局版本 ${caps.revision} · 协议 ${caps.protocol}`);}catch(e){info(e.message);}};
 $('#deploy-layout').onclick=async()=>{const button=$('#deploy-layout');button.disabled=true;try{packLayout(snapshot().document);info('正在下发并写入设备布局分区…');const result=await request('/api/deploy/layout',{method:'POST',body:{address:$('#device-address').value,token:$('#device-token').value,document:snapshot().document}});if(!result.accepted)throw new Error('设备未接受布局');info(`设备已接收 ${result.bytes} 字节，等待屏幕切换确认…`);for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,200));const caps=await request('/api/deploy/device?address='+encodeURIComponent($('#device-address').value));if(caps.revision!==result.previousRevision){info(`部署完成 · 设备布局版本 ${caps.revision} · 重启后保留`);notify('布局已部署到设备');return;}}throw new Error('数据已接收，但未确认屏幕采用新布局，请检查设备状态');}catch(e){info(e.message);}finally{button.disabled=false;}};
 $('#refresh-ports').onclick=async()=>{try{const {ports}=await request('/api/deploy/ports');$('#flash-port').replaceChildren(...ports.map(p=>new Option(p.port+' · '+p.name,p.port)));info(ports.length?'选择 ESP32 数据线对应串口':'未发现串口，请连接数据线');}catch(e){info(e.message);}};
 async function poll(){try{const state=await request('/api/deploy/flash');$('#flash-runtime').disabled=state.running;$('#usb-layout').disabled=state.running;$('#flash-output').textContent=state.error||state.output;if(!state.running){clearInterval(timer);timer=null;}}catch(e){info(e.message);}}
 $('#usb-layout').onclick=async()=>{try{if(!$('#flash-port').value)throw new Error('请刷新并选择 ESP32 串口');$('#usb-layout').disabled=true;await request('/api/deploy/usb-layout',{method:'POST',body:{port:$('#flash-port').value,document:snapshot().document}});await poll();timer=setInterval(poll,1000);}catch(e){info(e.message);$('#usb-layout').disabled=false;}};
 $('#flash-runtime').onclick=async()=>{try{if(!$('#flash-port').value)throw new Error('请刷新并选择 ESP32 串口');$('#flash-runtime').disabled=true;await request('/api/deploy/flash',{method:'POST',body:{port:$('#flash-port').value}});await poll();timer=setInterval(poll,1000);}catch(e){info(e.message);$('#flash-runtime').disabled=false;}};
}
