export const durations=[7,12,14,14,12,12];
const events=[
 [ [0,'El driver recibe la consulta.'],[2,'El driver registra el filtro de ventas válidas.'],[4,'El driver incorpora la agrupación y la suma al plan.'],[6,'El plan de operaciones está definido; todavía no se procesan registros.'] ],
 [ [0,'El driver solicita recursos al gestor del clúster.'],[3,'El gestor asigna recursos en los tres workers.'],[7,'Los executors se registran con el driver.'],[11,'Hay tres executors disponibles y seis espacios de tarea.'] ],
 [ [0,'El driver envía las tareas T1 a T6 a los executors.'],[3,'Cada tarea lee su partición: P1, P2, P3, P4, P5 o P6.'],[7,'Las tareas filtran los registros. La venta V8 se descarta por estar cancelada.'],[11,'Los executors notifican la finalización de las seis tareas.'] ],
 [ [0,'El driver programa las tareas T7, T8 y T9 de la segunda etapa.'],[3,'Los registros se redistribuyen por categoría mediante shuffle.'],[10,'Las particiones Q1, Q2 y Q3 reúnen los importes de cada categoría.'],[13,'La redistribución ha finalizado: siete registros válidos en tres destinos.'] ],
 [ [0,'Las tareas T7, T8 y T9 leen las particiones Q1, Q2 y Q3.'],[2,'Cada tarea acumula los importes de su categoría.'],[8,'Los totales calculados son Bs 300, Bs 120 y Bs 80.'],[10,'Los executors informan del progreso al driver.'] ],
 [ [0,'Las tareas de la segunda etapa comienzan la escritura.'],[2,'Los tres resultados se transfieren al almacenamiento de salida.'],[8,'Los executors confirman que la escritura ha terminado.'],[11,'El driver marca el trabajo como completado. La tabla contiene tres filas.'] ],
];
export function timeline(phase,time){
 const duration=durations[phase],t=Math.max(0,Math.min(time,duration));
 const list=events[phase];let event=0;list.forEach((e,i)=>{if(t>=e[0])event=i;});
 return {phase,time:t,duration,progress:t/duration,event,message:list[event][1],complete:t>=duration};
}
export const lerpProgress=(time,start,duration)=>Math.max(0,Math.min(1,(time-start)/duration));
