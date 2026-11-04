import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {sales,validSales,categories,totals} from './content.js';
import {lerpProgress as progress} from './simulation.js';
const palette={driver:0x9ba9e7,manager:0xc0a0e5,worker:0xd2dae4,executor:0x91cfc2,partition:0xf2cf8e,task:0xeeb39d,storage:0x94a7bb,output:0xabcc9d,reject:0xe9a6aa};
const categoryColors=[0xa7c9ee,0xd7b7e7,0xc5dda6];
const short=['TEC','HOG','ALI'];
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
export function createCluster(host,onSelect,onViewChange=()=>{},onInvalidate=()=>{}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#f9fafc');
 const camera=new THREE.OrthographicCamera(-18,18,14,-14,.1,120);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
 const labels=new CSS2DRenderer();labels.domElement.className='labels';host.append(labels.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minZoom=.65;controls.maxZoom=2.4;controls.maxPolarAngle=Math.PI*.43;
 let detailOverride=null,lastStateKey='';
 controls.addEventListener('change',onInvalidate);
 function fit(){
  const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  const vertical=Math.max(23,34/(w/h)),horizontal=vertical*w/h;
  camera.left=-horizontal/2;camera.right=horizontal/2;camera.top=vertical/2;camera.bottom=-vertical/2;
  const detailed=detailOverride??w>=1050;
  camera.zoom=detailed&&w<650?1.6:1;camera.updateProjectionMatrix();
  host.classList.toggle('is-overview',!detailed);host.dataset.view=detailed?'detail':'general';onViewChange(detailed);
  renderer.setSize(w,h);labels.setSize(w,h);onInvalidate();
 }
 function reset(){camera.position.set(0,27,23);controls.target.set(0,0,1);detailOverride=null;controls.update();fit();}reset();
 scene.add(new THREE.HemisphereLight(0xffffff,0xcbd5e1,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,16,8);scene.add(light);
 const grid=new THREE.GridHelper(40,20,0xe2e6ef,0xeff1f6);grid.position.y=-.12;scene.add(grid);
 const interactive=[],nodes=[],routes=[],workers=[];let state={mode:'components',component:'driver',phase:0};
 function tag(parent,title,sub,id,point,className='node-label'){
  const el=document.createElement(id?'button':'div');el.className=className;el.innerHTML='<strong></strong><span></span>';el.querySelector('strong').textContent=title;el.querySelector('span').textContent=sub;
  if(id)el.onclick=()=>onSelect(id,{name:el.querySelector('strong').textContent,details:el.querySelector('span').textContent});
  const object=new CSS2DObject(el);object.position.copy(point);parent.add(object);
  return {el,object,title:el.querySelector('strong'),sub:el.querySelector('span')};
 }
 function block(parent,width,height,depth,color,point,id){const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.05}));mesh.position.copy(point);parent.add(mesh);if(id){mesh.userData.id=id;interactive.push(mesh);}return mesh;}
 function node(id,title,sub,x,z,width,color){const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);const mesh=block(group,width,1,2,color,v(0,.5,0),id);const label=tag(group,title,sub,id,v(0,2,0));label.el.style.setProperty('--node-color','#'+color.toString(16).padStart(6,'0'));const n={id,group,mesh,label};nodes.push(n);return n;}
 const driver=node('driver','DRIVER','Coordinación de la aplicación',-6,-7,3.8,palette.driver);
 const manager=node('manager','GESTOR DEL CLÚSTER','Asignación de recursos',6,-7,3.8,palette.manager);
 const source=new THREE.Group();scene.add(source);const sourceMesh=block(source,27,.18,3,palette.storage,v(0,-.01,8),'storage');const sourceTag=tag(source,'ALMACENAMIENTO DE ENTRADA','8 ventas distribuidas en P1 a P6','storage',v(0,.3,10.4),'storage-label');
 const destination=new THREE.Group();scene.add(destination);const destinationMesh=block(destination,25,.2,3,palette.output,v(0,0,8),'storage');const destinationTag=tag(destination,'ALMACENAMIENTO DE SALIDA','salida/ventas_por_categoria/','storage',v(0,.3,12),'storage-label output-label');
 const storageElements=[{mesh:sourceMesh,label:sourceTag},{mesh:destinationMesh,label:destinationTag}].map(item=>{
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(item.mesh.geometry),new THREE.LineBasicMaterial({color:0x101828}));
  outline.position.copy(item.mesh.position);outline.scale.set(1.01,1.3,1.04);item.mesh.parent.add(outline);
  return {...item,outline};
 });
 const discarded=new THREE.Group();scene.add(discarded);const rejectTag=tag(discarded,'V8 DESCARTADA','Tecnología · Bs 999 · cancelada',null,v(12,2.2,3.4),'reject-label');
 for(let i=0;i<3;i++){
  const x=-8+i*8;const group=new THREE.Group();group.position.set(x,0,0);scene.add(group);
  const base=block(group,6.9,.3,5,palette.worker,v(0,.15,0),'worker');
  const label=tag(group,`WORKER ${i+1}`,'Máquina de procesamiento','worker',v(0,.3,3),'worker-label');
  const executor=block(group,6,.45,4,palette.executor,v(0,.65,0),'executor');
  const execTag=tag(group,`Executor ${i+1}`,'Proceso de la aplicación','executor',v(0,1.8,-3),'executor-label');
  const slots=[];
  for(let j=0;j<2;j++){
   const slot=block(group,2.3,.22,1.7,palette.task,v(-1.6+j*3.2,1,.1),'task');
   const taskTag=tag(group,`T${i*2+j+1}`,'Espacio de tarea','task',v(-1.6+j*3.2,1.25,1.9),'task-label');
   slots.push({slot,tag:taskTag});
  }
  workers.push({group,base,label,executor,execTag,slots});
 }
 const partitionSources=Array.from({length:6},(_,i)=>v(-11+i*4.4,.65,8));
 const partitionTargets=Array.from({length:6},(_,i)=>v(-8+Math.floor(i/2)*8+(i%2?1.6:-1.6),1.45,.2));
 const partitions=partitionSources.map((point,i)=>{
  const group=new THREE.Group();group.position.copy(point);scene.add(group);const mesh=block(group,2.5,.3,1.8,palette.partition,v(0,0,0),'partition');
  const rows=sales.filter(s=>s.partition===i+1);const label=tag(group,`P${i+1} · ${rows.length} ${rows.length===1?'venta':'ventas'}`,rows.map(s=>`V${s.id}: ${short[categories.indexOf(s.category)]} ${s.amount}`).join(' | '),'partition',v(0,.75,0),'partition-label');
  return {group,mesh,label,rows};
 });
 const targets=categories.map((category,i)=>{
  const group=new THREE.Group();group.position.set(-8+i*8,1.45,.3);scene.add(group);block(group,4.5,.35,2,palette.partition,v(0,0,0),'partition');
  const label=tag(group,`Q${i+1} · ${category}`,'Sin registros','partition',v(0,.9,0),'partition-label destination-partition');
  const result=tag(group,'Bs 0','Total acumulado',null,v(0,1,2.2),'result-label');
  return {group,label,result};
 });
 const recordPackets=validSales.map((sale,i)=>{
  const group=new THREE.Group();scene.add(group);const category=categories.indexOf(sale.category);block(group,.48,.4,.48,categoryColors[category],v(0,0,0));
  const label=tag(group,`V${sale.id} · ${short[category]} ${sale.amount}`,'',null,v(0,.6,0),'record-label');label.el.style.setProperty('--record-color','#'+categoryColors[category].toString(16).padStart(6,'0'));
  return {group,sale,category,start:3+i*.5};
 });
 const rejectPacket=new THREE.Group();scene.add(rejectPacket);block(rejectPacket,.6,.5,.6,palette.reject,v(0,0,0));tag(rejectPacket,'V8 · Bs 999','Venta cancelada',null,v(0,.7,0),'record-label reject-label');
 const arcResult=new THREE.Vector3();
 function arc(a,b,f,lift=2){return arcResult.lerpVectors(a,b,f).addScaledVector(THREE.Object3D.DEFAULT_UP,2*(1-f)*f*lift);}
 function route(a,b,type,start,end,phase,labelText){const mid=a.clone().lerp(b,.5);mid.y+=2;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));const color=type==='allocation'?0x8a5bb5:type==='data'?0xb8782c:0x4c68b6;
  const material=type==='data'?new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}):new THREE.LineDashedMaterial({color,dashSize:.3,gapSize:.18,transparent:true,opacity:.9});
  const line=new THREE.Line(geometry,material);line.computeLineDistances();scene.add(line);
  const arrow=new THREE.ArrowHelper(curve.getTangent(.8).normalize(),curve.getPoint(.8),.7,color,.45,.3);scene.add(arrow);
  const packet=block(scene,type==='data'?.28:.18,.2,.28,color,v(0,0,0));
  let message;if(labelText)message=tag(scene,labelText,'',null,mid.clone().add(v(0,.7,0)),'flow-message');
  routes.push({curve,line,arrow,packet,start,end,phase,message});
 }
 route(v(-4,1,-7),v(4,1,-7),'control',0,3,1,'1. Solicitud de recursos');
 for(let i=0;i<3;i++){
  const x=-8+i*8;
  route(v(6,1,-6),v(x,1,-2),'allocation',3,7,1,i===2?'2. Asignación de recursos':null);
  route(v(x,1,-2),v(-6,1,-6),'control',7,12,1,i===0?'3. Registro de executors':null);
  route(v(-6,1,-6),v(x,1,-2),'control',0,3,2,i===1?'Envío de T1 a T6':null);
  route(v(x,1,-2),v(-6,1,-6),'control',11,14,2,i===0?'Avisos de finalización':null);
  route(v(-6,1,-6),v(x,1,-2),'control',0,3,3,i===1?'Programación de T7 a T9':null);
  route(v(x,1,-2),v(-6,1,-6),'control',10,12,4,i===0?'Avisos de progreso':null);
  route(v(x,1,-2),v(-6,1,-6),'control',8,11,5,i===0?'Confirmación de escritura':null);
 }
 for(let i=0;i<6;i++)route(partitionSources[i],partitionTargets[i],'data',3,7,2);
 for(let i=0;i<3;i++)route(v(-8+i*8,1,.3),v(-8+i*8,1,8),'data',2,8,5);
 const planSteps=['Filtrar ventas válidas','Agrupar por categoría','Sumar importes','Guardar resultados'];
 const plan=tag(scene,'PLAN DEL DRIVER','',null,v(-6,3,-3.5),'plan-label');
 function update(next){state=next;}
 function tick(dt,frame,running,speed){
  const learn=state.mode==='components',p=state.phase,t=frame.time;
  const stateKey=`${state.mode}/${state.component}/${p}/${t}/${running}`;
  if(stateKey!==lastStateKey){lastStateKey=stateKey;
  host.dataset.phase=String(p);host.dataset.time=t.toFixed(2);host.dataset.complete=String(frame.complete);
  // Los colores identifican funciones; el contorno identifica la selección.
  nodes.forEach(n=>{const selected=learn&&state.component===n.id;n.label.el.classList.toggle('selected',selected);n.mesh.material.emissive.setHex(selected?0xffffff:0);n.mesh.material.emissiveIntensity=selected?.12:0;});
  storageElements.forEach(({mesh,label,outline})=>{
   const selected=learn&&state.component==='storage';
   label.el.classList.toggle('selected',selected);outline.visible=selected;
   mesh.material.emissive.setHex(selected?0xffffff:0);mesh.material.emissiveIntensity=selected?.25:0;
  });
  text(driver.label.sub,learn?'Coordinación de la aplicación':p===0?(t<6?'Construye el plan':'Plan definido'):p===1?(t<3?'Solicita recursos':t<7?'Espera executors':'Recibe registros'):p===2?(t<3?'Envía seis tareas':t<11?'Supervisa las tareas':'Recibe seis avisos'):p===3?'Programa la segunda etapa':p===4?'Supervisa la agregación':t<11?'Espera confirmación':'Trabajo completado');
  text(manager.label.sub,learn?'Asignación de CPU y memoria':p===0?'Sin solicitud en esta fase':p===1?(t<3?'Recibe solicitud':t<7?'Asigna recursos':'Recursos asignados'):'Mantiene los recursos asignados');
  source.visible=learn||p<3;destination.visible=!learn&&p===5;discarded.visible=!learn&&(p===2&&t>=7||p>2);rejectTag.object.visible=discarded.visible;
  plan.object.visible=!learn&&p===0;text(plan.sub,planSteps.slice(0,Math.min(4,1+Math.floor(t/2))).join(' → '));
  workers.forEach((w,i)=>{
   const available=learn||p>1||p===1&&t>=4+i;
   w.executor.visible=available;w.execTag.object.visible=available;
   text(w.execTag.sub,learn?'Proceso de la aplicación':p===1?(t<7?'Inicialización':t<12?'Registro en curso':'Registrado con el driver'):p===2?(t<3?'Recibe tareas':t<7?'Lee particiones':t<11?'Filtra registros':'Tareas finalizadas'):p===3?(t<3?'Recibe tarea':'Intercambia datos'):p===4?(t<8?'Calcula el total':'Total calculado'):p===5?(t<8?'Escribe el resultado':'Escritura confirmada'):'No iniciado');
   w.label.el.classList.toggle('selected',learn&&state.component==='worker');w.execTag.el.classList.toggle('selected',learn&&state.component==='executor');
   w.executor.material.emissive.setHex(palette.executor);w.executor.material.emissiveIntensity=!learn&&available&&running?.15+.1*Math.sin(t*4+i):0;
   w.slots.forEach(({slot,tag:taskTag},j)=>{
    const active=available&&(learn||p>=2&&(p<3||j===0));slot.visible=available;taskTag.object.visible=active;
    text(taskTag.title,learn||p<3?`T${i*2+j+1}`:`T${i+7}`);
    text(taskTag.sub,learn?'Espacio de tarea':p===2?(t<3?'Asignada':t<11?`Procesa P${i*2+j+1}`:'Finalizada'):p===3?`Lee Q${i+1}`:p===4?`Suma Q${i+1}`:t<8?'Guarda resultado':'Finalizada');
    taskTag.el.classList.toggle('selected',learn&&state.component==='task');slot.material.color.setHex(active?palette.task:0x90a4ae);
   });
  });
  partitions.forEach((part,i)=>{
   const f=!learn&&p===2?progress(t,3,4):0;
   part.group.visible=learn||p<=2||p===3&&t<3;
   part.group.position.copy(learn||p<2?partitionSources[i]:p===3?partitionTargets[i]:arc(partitionSources[i],partitionTargets[i],f,3));
   const filtered=!learn&&(p===2&&t>=7||p>2);
   const rows=filtered?part.rows.filter(s=>s.valid):part.rows;
   text(part.label.title,`P${i+1} · ${rows.length} ${rows.length===1?'venta':'ventas'}`);
   text(part.label.sub,rows.map(s=>`V${s.id}: ${short[categories.indexOf(s.category)]} ${s.amount}`).join('\n')||'Sin ventas válidas');
   part.mesh.material.color.setHex(i===5&&filtered?0xb0bec5:palette.partition);
   part.label.el.classList.toggle('selected',learn&&state.component==='partition');
   part.label.el.dataset.partition=`P${i+1}`;part.label.el.dataset.records=String(rows.length);part.label.el.dataset.countLabel=`${rows.length} ${rows.length===1?'registro':'registros'}`;
  });
  rejectPacket.visible=!learn&&p===2&&t>=7&&t<10;
  rejectPacket.position.copy(arc(partitionTargets[5],v(12,1,3.4),progress(t,7,3),2));
  recordPackets.forEach(packet=>{
   const f=progress(t,packet.start,4);
   packet.group.visible=!learn&&p===3&&t>=packet.start&&f<1;
   const start=partitionTargets[packet.sale.partition-1];const end=v(-8+packet.category*8,1.45,.3);
   packet.group.position.copy(arc(start,end,f,4+packet.category));
  });
  targets.forEach((target,i)=>{
   const matching=validSales.filter(s=>s.category===categories[i]);
   target.group.visible=!learn&&(p>3||p===3&&t>=3);
   const arrived=p===3?recordPackets.filter(r=>r.category===i&&t>=r.start+4).map(r=>r.sale):matching;
   const written=p===5?progress(t,2,6):0;
   target.group.position.copy(p===5?arc(v(-8+i*8,1.45,.3),v(-8+i*8,.7,8),written,3):v(-8+i*8,1.45,.3));
   text(target.label.title,`Q${i+1} · ${categories[i]}`);
   text(target.label.sub,arrived.length?arrived.map(s=>`Bs ${s.amount}`).join(' · '):'Esperando registros');
   target.label.el.dataset.partition=`Q${i+1}`;target.label.el.dataset.records=String(arrived.length);target.label.el.dataset.countLabel=`${arrived.length} ${arrived.length===1?'registro':'registros'}`;
   target.result.object.visible=p>=4;
   const count=p===4?Math.min(matching.length,Math.floor(progress(t,2,6)*matching.length)):matching.length;
   const sum=matching.slice(0,count).reduce((acc,s)=>acc+s.amount,0);
   text(target.result.title,`Bs ${sum}`);
   text(target.result.sub,p===5?(written<1?'Transferencia a la salida':'Resultado guardado'):t<8?'Acumulando importes':'Total calculado');
   target.result.el.dataset.total=String(sum);
  });
  routes.forEach(r=>{
   const visible=!learn&&r.phase===p&&t>=r.start&&t<r.end;
   r.line.visible=visible;r.arrow.visible=visible;r.packet.visible=visible;if(visible)r.packet.position.copy(r.curve.getPoint(progress(t,r.start,r.end-r.start)));
   if(r.message)r.message.object.visible=visible;
  });
  }
  controls.update();renderer.render(scene,camera);labels.render(scene,camera);
 }
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactive).find(h=>{let n=h.object;while(n){if(!n.visible)return false;n=n.parent;}return true;});if(hit)onSelect(hit.object.userData.id);});
 new ResizeObserver(fit).observe(host);
 return {update,tick,reset,toggleDetail(){detailOverride=host.classList.contains('is-overview');fit();}};
}

