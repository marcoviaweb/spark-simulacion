import './style.css';
import {components,phases,sales,validSales,totals,categories} from './content.js';
import {createCluster} from './scene.js';
import {timeline,durations,lerpProgress} from './simulation.js';
let mode='components',component=0,phase=0,playing=false,elapsed=0,speed=1,autoplay=false,lastEvent='';
const $=s=>document.querySelector(s);
const setText=(selector,value)=>{const el=$(selector);if(el.textContent!==value)el.textContent=value;};
const table=(headers,rows)=>`<table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const finalTable=()=>table(['Categoría','Total válido'],totals.map(t=>[t.category,`Bs ${t.amount}`]));
$('#app').innerHTML=`
<header><a class="brand" href="./"><span class="logo">S</span><span>Apache Spark <small>Procesamiento distribuido paso a paso</small></span></a><span class="badge"><i></i> Simulación</span></header>
<main>
<section class="intro"><span class="eyebrow">ARQUITECTURA Y EJECUCIÓN</span><h1>Cómo funciona Apache Spark</h1><p>Identifica los componentes de un clúster y observa cómo colaboran para transformar ocho registros de ventas en una tabla de resultados.</p><div class="intro-route"><span>Componentes</span><b>→</b><span>Seis fases explicativas</span><b>→</b><span>Resultado verificable</span></div></section>
<section class="goal" aria-label="Objetivo del ejemplo"><div><span class="eyebrow">OBJETIVO DEL CÁLCULO</span><h2>Calcular las ventas válidas por categoría</h2><p>La entrada contiene <strong>8 ventas en 6 particiones</strong>. Se excluye una venta cancelada y se suman los importes de las <strong>7 ventas válidas</strong>, agrupadas por categoría.</p><details><summary>Consultar los registros de entrada</summary>${table(['Registro','Categoría','Importe','Estado','Partición'],sales.map(s=>[`V${s.id}`,s.category,`Bs ${s.amount}`,s.valid?'Válida':'Cancelada',`P${s.partition}`]))}</details></div><div class="goal-output"><span class="eyebrow">RESULTADO ESPERADO</span>${finalTable()}<small>Los tres totales se guardarán en <code>salida/ventas_por_categoria/</code>.</small></div></section>
<nav class="mode-tabs" aria-label="Orden de aprendizaje"><button id="learn" aria-pressed="true"><span>1</span> Componentes del clúster</button><button id="simulate" aria-pressed="false"><span>2</span> Simulación de la ejecución</button></nav>
<section class="learning" aria-labelledby="section-title"><div class="section-heading"><span class="eyebrow" id="section-number"></span><h2 id="section-title"></h2><p id="section-description"></p></div><div id="choices" class="choices"></div>
<div class="workspace"><div class="visual"><div class="scene-heading"><strong id="scene-title"></strong><button id="reset-camera" class="text-button">Restablecer vista</button></div>
<div class="animation-controls" id="animation-controls" hidden><button id="play" class="primary">Ⅱ Pausar</button><button id="repeat" class="secondary">↺ Repetir fase</button><button id="play-all" class="secondary">▶ Recorrido completo</button><label>Velocidad <select id="speed"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><span id="animation-state"></span></div>
<div class="live-event" id="live-event" hidden><span id="live-step"></span><p id="live-message" aria-live="polite"></p><div class="progress-track"><div id="phase-progress"></div></div></div>
<div class="scene-scroll"><div id="scene" aria-label="Representación 3D animada del clúster de Spark"></div></div><p id="scene-fallback" hidden>La vista 3D no está disponible. Las descripciones, los controles y el registro de datos permiten seguir la ejecución.</p>
<div class="legend"><span><i class="control-key"></i> Instrucciones y avisos</span><span><i class="allocation-key"></i> Asignación de recursos</span><span><i class="data-key"></i> Transferencia de datos</span></div>
<div class="component-colors"><span class="driver-key">Driver</span><span class="manager-key">Gestor</span><span class="worker-key">Worker</span><span class="executor-key">Executor</span><span class="partition-key">Partición</span><span class="task-key">Tarea</span><span class="output-key">Resultado</span><span class="reject-key">Descartado</span></div>
<p class="scene-help">P identifica particiones de entrada; Q identifica particiones después del shuffle. TEC: Tecnología · HOG: Hogar · ALI: Alimentos.</p><p class="scene-help">Selecciona una etiqueta para consultar su función. Arrastra para rotar; usa la rueda para acercar. En pantallas pequeñas, desplaza horizontalmente la escena.</p>
<div id="component-inspect" class="component-inspect" hidden></div><div class="activity" id="activity"></div></div>
<div class="information"><aside id="detail" aria-live="polite"></aside><section class="data-monitor" id="data-monitor"><span class="eyebrow">DATOS DE LA REPRESENTACIÓN</span><h3 id="data-title"></h3><div id="data-state"></div><p id="data-caption"></p></section></div></div>
<div class="navigation"><button id="back" class="secondary">← Anterior</button><span id="position"></span><button id="continue" class="primary">Siguiente componente →</button></div>
</section>
<section class="phase-overview"><span class="eyebrow">RESUMEN DE LA EJECUCIÓN</span><h2>Operaciones y resultados de las seis fases</h2><p>Las seis fases organizan esta explicación. El ejemplo representa <strong>dos etapas de Spark</strong> separadas por un shuffle; las fases de suma y escritura pertenecen a la misma segunda etapa.</p><div class="table-scroll">${table(['Fase','Componentes participantes','Resultado de la fase'],phases.map((p,i)=>[`${i+1}. ${p.name}`,p.actor,p.output]))}</div><dl class="glossary"><div><dt>Trabajo · job</dt><dd>Cálculo activado por una acción que solicita un resultado, como guardar.</dd></div><div><dt>Etapa · stage</dt><dd>Grupo de tareas que procesan sus particiones sin otro shuffle intermedio.</dd></div><div><dt>Redistribución · shuffle</dt><dd>Intercambio de datos entre particiones para reunir los registros de una misma clave.</dd></div></dl></section>
<section class="final-result"><div><span class="eyebrow">PRODUCTO FINAL</span><h2>Una tabla con los totales por categoría</h2><p>Los tres resultados se guardan como archivos de salida y pueden utilizarse en un informe o en otro procesamiento.</p><p>La venta V8, cancelada por Bs 999, se excluye del cálculo. El total válido es <strong>Bs 500</strong>.</p><button class="secondary" id="show-final">Observar la escritura de resultados →</button></div><div>${finalTable()}<p class="file-output">▤ salida/ventas_por_categoria/</p><button class="primary" id="download">Descargar resultado de ejemplo (.csv)</button><small>Archivo calculado con los mismos registros que utiliza la representación.</small></div></section>
<footer><strong>Apache Spark · Simulación del procesamiento distribuido</strong><p>Modelo batch simplificado, sin conexión a un clúster real. La adquisición de recursos y el plan de ejecución pueden variar según la configuración y las optimizaciones de Spark.</p><a href="https://spark.apache.org/docs/latest/cluster-overview.html" target="_blank" rel="noreferrer">Arquitectura de Spark ↗</a> · <a href="https://spark.apache.org/docs/latest/rdd-programming-guide.html" target="_blank" rel="noreferrer">Transformaciones y shuffle ↗</a></footer>
</main>`;
let cluster;
function startPhase(i,all=false){mode='phases';phase=i;elapsed=0;playing=true;autoplay=all;lastEvent='';$('#component-inspect').hidden=true;render();}
function setMode(next){if(next==='phases'){startPhase(phase);return;}mode=next;playing=false;autoplay=false;lastEvent='';render();}
function selectComponent(id){const c=components.find(x=>x.id===id)||components[0];if(mode==='phases'){$('#component-inspect').hidden=false;$('#component-inspect').innerHTML=`<strong>${c.name} · ${c.kind}</strong><p>${c.description}</p>`;}else{component=components.indexOf(c);render();}}
function artifact(p){
 if(p.view==='plan')return '<ol class="plan"><li>Leer las ventas</li><li>Excluir las ventas canceladas</li><li>Agrupar y sumar por categoría</li><li>Guardar los totales</li></ol>';
 if(p.view==='resources')return '<div class="resource-grid">'+[1,2,3].map(i=>`<div><strong>Worker ${i}</strong><span>Executor ${i}</span><small>2 espacios de tarea</small></div>`).join('')+'</div>';
 if(p.view==='filtered')return '<small>Al finalizar: T1 procesa P1, T2 procesa P2 y así hasta T6. P6 queda vacía tras descartar V8.</small>';
 if(p.view==='grouped')return '<small>Q1 → T7 · Q2 → T8 · Q3 → T9. Cada tarea recibe los datos de una categoría.</small>';
 return finalTable()+(p.view==='saved'?'<p class="file-output">▤ salida/ventas_por_categoria/</p>':'<small>La fase siguiente representa la escritura de estos resultados.</small>');
}
function render(){
 const learn=mode==='components',c=components[component],p=phases[phase];
 $('#learn').setAttribute('aria-pressed',learn);$('#simulate').setAttribute('aria-pressed',!learn);
 $('#section-number').textContent=learn?'MÓDULO 1 · ARQUITECTURA':'MÓDULO 2 · EJECUCIÓN ANIMADA';
 $('#section-title').textContent=learn?'Componentes y responsabilidades':'Secuencia de ejecución del cálculo';
 $('#section-description').textContent=learn?'Selecciona cada componente para identificar su ubicación, función y relación con los datos.':'Cada fase se anima al seleccionarla y se detiene al finalizar. Puedes pausar, repetir y avanzar manualmente, o reproducir el recorrido completo.';
 $('#choices').classList.toggle('phase-choices',!learn);
 $('#choices').innerHTML=(learn?components:phases).map((x,i)=>`<button aria-pressed="${i===(learn?component:phase)}" data-index="${i}"><span>${i+1}</span>${x.name}</button>`).join('');
 $('#choices').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(learn){component=Number(b.dataset.index);render();}else startPhase(Number(b.dataset.index));});
 $('#scene-title').textContent=learn?`${c.name} · ${c.kind}`:`Fase ${phase+1} de 6 · ${p.name}`;
 $('#detail').innerHTML=learn?`<span class="type">${c.kind}</span><h3>${c.name}</h3><p class="subtitle">${c.subtitle}</p><p>${c.description}</p><h4>Participación en el ejemplo</h4><p>${c.example}</p><h4>Función del componente</h4><p>${c.product}</p>`:`<span class="type">Fase ${phase+1} de 6</span><h3>${p.title}</h3><p class="subtitle">Componentes participantes: ${p.actor}</p><h4>Datos o requisitos de entrada</h4><p>${p.input}</p><h4>Operación realizada</h4><p>${p.description}</p><div class="output"><h4 id="outcome-title">Resultado previsto al finalizar</h4><p>${p.output}</p></div><div class="artifact">${artifact(p)}</div><p class="stage-label">${p.stage}</p>`;
 $('#activity').innerHTML=learn?'<strong>Relación entre los componentes</strong><p>Cada worker aloja un executor. Cada executor ejecuta tareas. Cada tarea procesa una partición de datos en una etapa.</p>':`<div><strong>Driver</strong><span>${p.driver}</span></div><div><strong>Gestor del clúster</strong><span>${p.manager}</span></div><div><strong>Executors</strong><span>${p.executors}</span></div>`;
 $('#position').textContent=learn?`Componente ${component+1} de 7`:`Fase ${phase+1} de 6`;
 $('#back').disabled=learn?component===0:phase===0;
 $('#continue').textContent=learn?(component===6?'Iniciar la simulación →':'Siguiente componente →'):(phase===5?'Reiniciar el recorrido ↺':'Siguiente fase →');
 $('#animation-controls').hidden=learn;$('#live-event').hidden=learn;$('#data-monitor').hidden=false;
 $('#play').textContent=playing?'Ⅱ Pausar':'▶ Continuar';
 cluster?.update({mode,component:c.id,phase});lastEvent='';updateLive(timeline(phase,elapsed));
}
function updateLive(frame){
 const learn=mode==='components';
 setText('#animation-state',frame.complete?'Fase finalizada':playing?'Animación en ejecución':'Animación en pausa');
 setText('#play',frame.complete?'▶ Reproducir fase':playing?'Ⅱ Pausar':'▶ Continuar');
 $('#phase-progress').style.width=`${frame.progress*100}%`;
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
$('#back').onclick=()=>{if(mode==='components'){component=Math.max(0,component-1);render();}else startPhase(Math.max(0,phase-1));};
$('#continue').onclick=()=>{if(mode==='components'){if(component===6)startPhase(0);else{component++;render();}}else startPhase((phase+1)%6);};
$('#play').onclick=()=>{if(elapsed>=durations[phase]){startPhase(phase);return;}playing=!playing;updateLive(timeline(phase,elapsed));};
$('#repeat').onclick=()=>startPhase(phase);
$('#play-all').onclick=()=>startPhase(0,true);
$('#speed').onchange=e=>speed=Number(e.target.value);
$('#show-final').onclick=()=>{startPhase(5);$('.learning').scrollIntoView({behavior:'smooth'});};
$('#download').onclick=()=>{const csv='\uFEFFCategoría,Total válido (Bs)\r\n'+totals.map(t=>`${t.category},${t.amount}`).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ventas_por_categoria.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();
try{cluster=createCluster($('#scene'),selectComponent);$('#reset-camera').onclick=()=>cluster.reset();render();}catch(e){console.error(e);$('#scene-fallback').hidden=false;}
let last=performance.now();
function animate(now){
 const delta=Math.min((now-last)/1000,.1);last=now;
 if(mode==='phases'&&playing){elapsed=Math.min(durations[phase],elapsed+delta*speed);if(elapsed>=durations[phase]){if(autoplay&&phase<5){startPhase(phase+1,true);}else{playing=false;autoplay=false;}}}
 const frame=timeline(phase,elapsed);updateLive(frame);cluster?.tick(delta,frame,playing,speed);requestAnimationFrame(animate);
}
requestAnimationFrame(animate);


