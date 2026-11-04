import './style.css';
import {layout,icon,componentGroups,componentOrder} from './layout.js';
import {components,phases,sales,validSales,totals,categories} from './content.js';
import {createCluster} from './scene.js';
import {timeline,durations,lerpProgress} from './simulation.js';
let mode='components',component=0,phase=0,playing=false,elapsed=0,speed=1,autoplay=false,lastEvent='';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const $=s=>document.querySelector(s);
const setText=(selector,value)=>{const el=$(selector);if(el.textContent!==value)el.textContent=value;};
const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const finalTable=()=>table(['Categoría','Total válido'],totals.map(t=>[t.category,`Bs ${t.amount}`]));
$('#app').innerHTML=layout({table,finalTable,sales,phases});
let cluster, animationId=0, last=0, sceneVisible=true;
function wake(){if(!animationId&&!document.hidden&&sceneVisible){last=performance.now();animationId=requestAnimationFrame(animate);}}
function startPhase(i,all=false){mode='phases';phase=i;elapsed=0;playing=!reducedMotion.matches;autoplay=all;lastEvent='';$('#component-inspect').hidden=true;render();}
function setMode(next){if(next==='phases'){startPhase(phase);return;}mode=next;playing=false;autoplay=false;lastEvent='';render();}
function selectComponent(id,record){
 const c=components.find(x=>x.id===id)||components[0];
 if(mode==='phases'){$('#component-inspect').hidden=false;$('#component-inspect').replaceChildren();const title=document.createElement('strong');title.textContent=record?.name||c.name;const p=document.createElement('p');p.textContent=record?.details||c.description;$('#component-inspect').append(title,p);}
 else{component=components.indexOf(c);render();}
}
function artifact(p){
 if(p.view==='plan')return '<ol class="plan"><li>Leer las ventas</li><li>Excluir las ventas canceladas</li><li>Agrupar y sumar por categoría</li><li>Guardar los totales</li></ol>';
 if(p.view==='resources')return '<div class="resource-grid">'+[1,2,3].map(i=>`<div><strong>Worker ${i}</strong><span>Executor ${i}</span><small>2 espacios de tarea</small></div>`).join('')+'</div>';
 if(p.view==='filtered')return '<small>Al finalizar: T1 procesa P1, T2 procesa P2 y así hasta T6. P6 queda vacía tras descartar V8.</small>';
 if(p.view==='grouped')return '<small>Q1 → T7 · Q2 → T8 · Q3 → T9. Cada tarea recibe los datos de una categoría.</small>';
 return finalTable()+(p.view==='saved'?'<p class="file-output">▤ salida/ventas_por_categoria/</p>':'<small>La fase siguiente representa la escritura de estos resultados.</small>');
}
function render(){
 wake();
 const learn=mode==='components',c=components[component],p=phases[phase];
 $('#learn').setAttribute('aria-pressed',learn);$('#simulate').setAttribute('aria-pressed',!learn);
 $('#section-number').textContent=learn?'MÓDULO 1 · ARQUITECTURA':'MÓDULO 2 · EJECUCIÓN ANIMADA';
 $('#section-title').textContent=learn?'Componentes y responsabilidades':'Secuencia de ejecución del cálculo';
 $('#section-description').textContent=learn?'Los procesos de Spark utilizan infraestructura y conceptos generales. Explora cada grupo para conocer sus funciones.':'Selecciona una fase para observar su ejecución. Puedes pausar, repetir o reproducir el recorrido completo.';
 $('#choices').classList.toggle('phase-choices',!learn);
 $('#choices').innerHTML=learn?componentGroups.map(g=>`<div class="component-group"><div class="group-heading"><strong>${g.name}</strong><span>${g.note}</span></div><div class="group-items">${g.items.map(i=>`<button class="component-choice component-${components[i].id}" aria-pressed="${i===component}" data-index="${i}"><span class="component-icon">${icon(components[i].id)}</span><span class="choice-label">${components[i].name}<small>${components[i].kind}</small></span></button>`).join('')}</div></div>`).join(''):phases.map((p,i)=>`<button class="phase-choice" aria-pressed="${i===phase}" data-index="${i}"><span class="phase-number">${String(i+1).padStart(2,'0')}</span><span>${p.name}</span></button>`).join('');
 $('#choices').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(learn){component=Number(b.dataset.index);render();}else startPhase(Number(b.dataset.index));});
 $('#scene-title').textContent=learn?`${c.name} · ${c.kind}`:`Fase ${phase+1} de 6 · ${p.name}`;
 $('#detail').innerHTML=learn?`<span class="type">${componentGroups.find(g=>g.items.includes(component)).name}</span><span class="detail-icon component-${c.id}">${icon(c.id)}</span><h3>${c.name}</h3><p class="subtitle">${c.subtitle}</p><p>${c.description}</p><h4>Participación en el ejemplo</h4><p>${c.example}</p><h4>Función del componente</h4><p>${c.product}</p>`:`<span class="type">Fase ${phase+1} de 6</span><h3>${p.title}</h3><p class="subtitle">Componentes participantes: ${p.actor}</p><h4>Datos o requisitos de entrada</h4><p>${p.input}</p><h4>Operación realizada</h4><p>${p.description}</p><div class="output"><h4 id="outcome-title">Resultado previsto al finalizar</h4><p>${p.output}</p></div><div class="artifact">${artifact(p)}</div><p class="stage-label">${p.stage}</p>`;
 $('#activity').innerHTML=learn?'<strong>Relación entre los componentes</strong><p>Cada worker aloja un executor. Cada executor ejecuta tareas. Cada tarea procesa una partición de datos en una etapa.</p>':`<div><strong>Driver</strong><span>${p.driver}</span></div><div><strong>Gestor del clúster</strong><span>${p.manager}</span></div><div><strong>Executors</strong><span>${p.executors}</span></div>`;
 $('#position').textContent=learn?`Componente ${componentOrder.indexOf(component)+1} de 7`:`Fase ${phase+1} de 6`;
 $('#back').disabled=learn?componentOrder.indexOf(component)===0:phase===0;
 $('#continue').textContent=learn?(componentOrder.indexOf(component)===6?'Iniciar la simulación →':'Siguiente componente →'):(phase===5?'Reiniciar el recorrido ↺':'Siguiente fase →');
 $('#animation-controls').hidden=learn;$('#live-event').hidden=learn;$('#data-monitor').hidden=false;
 $('#play').textContent=playing?'Ⅱ Pausar':'▶ Continuar';
 cluster?.update({mode,component:c.id,phase});lastEvent='';updateLive(timeline(phase,elapsed));
}
function updateLive(frame){
 const learn=mode==='components';
 setText('#animation-state',frame.complete?'Fase finalizada':playing?'Animación en ejecución':'Animación en pausa');
 setText('#play',frame.complete?'▶ Reproducir fase':playing?'Ⅱ Pausar':'▶ Continuar');
 $('#phase-progress').style.transform=`scaleX(${frame.progress})`;
 $('#phase-progress').parentElement.setAttribute('aria-label',`Progreso de la fase: ${Math.round(frame.progress*100)} por ciento`);
 setText('#live-step',`Acción ${frame.event+1} de 4 · ${Math.min(frame.duration,Math.floor(frame.time))} / ${frame.duration} s`);
 const key=`${mode}/${phase}/${frame.event}/${frame.complete}/${Math.floor(frame.time*2)}`;
 if(key===lastEvent)return;lastEvent=key;
 setText('#live-message',frame.message);
 if(!learn)setText('#outcome-title',frame.complete?'Resultado de la fase':'Resultado previsto al finalizar');
 const t=frame.time;
 if(learn||phase<3){
  const filtered=!learn&&phase===2&&t>=7;
  $('#data-title').textContent=filtered?'Seis particiones · siete ventas válidas':'Seis particiones · ocho ventas de entrada';
  $('#data-state').innerHTML=table(['Partición','Registros e importes','Tarea'],Array.from({length:6},(_,i)=>{const rows=sales.filter(s=>s.partition===i+1&&(!filtered||s.valid));return [`<strong>P${i+1}</strong>`,rows.map(s=>`V${s.id} · ${s.category}: Bs ${s.amount}`).join('<br>')||(filtered?'Vacía · V8 descartada':'Sin registros'),`T${i+1}`];}));
  $('#data-caption').textContent=filtered?'La venta V8 se excluyó por estar cancelada. Las otras siete ventas conservan sus importes.':'Cada partición está identificada en la escena. TEC, HOG y ALI abrevian las categorías de esta tabla.';
 }else{
  $('#data-title').textContent=phase===3?'Registros recibidos después del shuffle':phase===4?'Acumulación por categoría':'Escritura de la tabla de salida';
  $('#data-state').innerHTML=table(['Partición y tarea','Registros recibidos','Total'],categories.map((category,i)=>{
   const matching=validSales.filter(s=>s.category===category);
   const arrived=phase===3?validSales.filter((s,j)=>s.category===category&&t>=7+j*.5):matching;
   const n=phase===4?Math.min(matching.length,Math.floor(lerpProgress(t,2,6)*matching.length)):matching.length;
   const sum=matching.slice(0,n).reduce((acc,s)=>acc+s.amount,0);
   return [`<strong>Q${i+1} · T${i+7}</strong><br>${category}`,arrived.map(s=>`V${s.id}: Bs ${s.amount}`).join('<br>')||'En espera',phase===3?'Pendiente':`Bs ${sum}`];
  }));
  $('#data-caption').textContent=phase===3?'Los siete registros válidos se desplazan hacia Q1, Q2 y Q3. Sus identificadores permiten seguirlos desde la entrada.':phase===4?'Cada total cambia a medida que la tarea incorpora los importes.':t<8?'Los resultados se transfieren al almacenamiento de salida.':'Escritura confirmada: tres filas guardadas, con un total válido de Bs 500.';
 }
}
$('#learn').onclick=()=>setMode('components');$('#simulate').onclick=()=>setMode('phases');
const jumpToLab=()=>$('#laboratorio').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
$('#start-learning').onclick=()=>{setMode('components');jumpToLab();};
$('#start-execution').onclick=()=>{startPhase(0);jumpToLab();};
let expanded=false,previousFocus;
function expandLab(next){
 const workspace=$('.workspace');expanded=next;
 workspace.classList.toggle('is-expanded',expanded);document.body.classList.toggle('focus-open',expanded);$('#focus-backdrop').hidden=!expanded;
 $('#fullscreen').setAttribute('aria-pressed',String(expanded));$('#fullscreen').setAttribute('aria-label',expanded?'Cerrar vista ampliada':'Ampliar laboratorio');
 if(expanded){previousFocus=document.activeElement;workspace.setAttribute('role','dialog');workspace.setAttribute('aria-modal','true');workspace.setAttribute('aria-label','Laboratorio de Spark ampliado');$('#fullscreen').focus();}
 else{workspace.removeAttribute('role');workspace.removeAttribute('aria-modal');workspace.removeAttribute('aria-label');previousFocus?.focus();}
}
$('#fullscreen').onclick=()=>expandLab(!expanded);$('#focus-backdrop').onclick=()=>expandLab(false);
document.addEventListener('keydown',e=>{
 if(!expanded)return;
 if(e.key==='Escape'){expandLab(false);return;}
 if(e.key==='Tab'){
  const items=[...$('.workspace').querySelectorAll('button,select,a[href],summary')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }
});
$('#view-mode').onclick=()=>cluster?.toggleDetail();
$('#back').onclick=()=>{if(mode==='components'){component=componentOrder[Math.max(0,componentOrder.indexOf(component)-1)];render();}else startPhase(Math.max(0,phase-1));};
$('#continue').onclick=()=>{if(mode==='components'){if(componentOrder.indexOf(component)===6)startPhase(0);else{component=componentOrder[componentOrder.indexOf(component)+1];render();}}else startPhase((phase+1)%6);};
$('#play').onclick=()=>{if(elapsed>=durations[phase]){startPhase(phase);return;}playing=!playing;updateLive(timeline(phase,elapsed));};
$('#repeat').onclick=()=>startPhase(phase);
$('#play-all').onclick=()=>startPhase(0,true);
$('#speed').onchange=e=>speed=Number(e.target.value);
$('#show-final').onclick=()=>{startPhase(5);$('.learning').scrollIntoView({behavior:'smooth'});};
$('#download').onclick=()=>{const csv='\uFEFFCategoría,Total válido (Bs)\r\n'+totals.map(t=>`${t.category},${t.amount}`).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ventas_por_categoria.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
try{cluster=createCluster($('#scene'),selectComponent,detailed=>{$('#view-mode').textContent=detailed?'Vista general':'Ver detalles';$('#view-mode').setAttribute('aria-pressed',String(detailed));},wake);$('#reset-camera').onclick=()=>cluster.reset();render();}catch(e){console.error(e);$('#scene-fallback').hidden=false;}
const frameInterval=1000/30;
function animate(now){
 animationId=0;
 if(document.hidden||!sceneVisible)return;
 const delta=Math.min((now-last)/1000,.1);
 if(now-last<frameInterval){animationId=requestAnimationFrame(animate);return;}
 last=now;
 if(mode==='phases'&&playing){elapsed=Math.min(durations[phase],elapsed+delta*speed);if(elapsed>=durations[phase]){if(autoplay&&phase<5){startPhase(phase+1,true);}else{playing=false;autoplay=false;}}}
 const frame=timeline(phase,elapsed);updateLive(frame);cluster?.tick(delta,frame,playing,speed);
 if(playing&&!animationId)animationId=requestAnimationFrame(animate);
}
function suspend(){if(animationId)cancelAnimationFrame(animationId);animationId=0;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else wake();});
new IntersectionObserver(entries=>{sceneVisible=entries[0].isIntersecting;if(sceneVisible)wake();else suspend();}).observe($('#scene'));
document.addEventListener('click',wake);
document.addEventListener('change',wake);
wake();
