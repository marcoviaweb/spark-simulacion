# Apache Spark: arquitectura y ejecución animada

Aplicación local con Three.js para introducir los componentes de Spark y observar una ejecución batch simplificada.

## Ejecutar y verificar

```sh
npm install
npm run dev
npm run build
node verify-simulation.mjs
```

## Recorrido

El primer módulo presenta driver, gestor del clúster, workers, executors, particiones, tareas y almacenamiento. La paleta distingue cada función y las conexiones de control se representan con trazos discontinuos.

El segundo módulo contiene seis fases explicativas. Cada fase comienza automáticamente al seleccionarla, conserva su estado final y permite pausar, continuar o repetir. El recorrido completo reproduce las fases consecutivamente. La velocidad modifica tanto la animación como los eventos y los contadores.

- Planificación: construcción progresiva del plan en el driver.
- Asignación: solicitud al gestor, asignación en workers e inicio y registro de executors.
- Lectura y filtrado: envío de T1 a T6, lectura de P1 a P6 y descarte visible de V8.
- Shuffle: programación de T7 a T9 y desplazamiento de los siete registros válidos a Q1, Q2 y Q3.
- Agregación: acumulación de importes y avisos al driver.
- Escritura: transferencia de los tres totales al almacenamiento y confirmación de finalización.

## Datos y coherencia

La escena y el panel utilizan los mismos ocho registros de `src/content.js`. P1 contiene V1 y V2; P2 contiene V3 y V4; P3 contiene V5; P4 contiene V6; P5 contiene V7; P6 contiene V8. La última venta está cancelada. Tras filtrarla quedan siete registros. Q1 reúne Tecnología, Q2 Hogar y Q3 Alimentos. Los totales calculados son Bs 300, Bs 120 y Bs 80, con un total de Bs 500. La descarga CSV contiene esos mismos resultados.

Los tiempos y eventos se controlan con `src/simulation.js`. Las etiquetas, el progreso, las cantidades y los movimientos se actualizan con un único reloj. Las pruebas verifican las secuencias, los límites temporales y la conservación de los datos válidos.

## Alcance

Las seis fases son una organización pedagógica, no seis etapas de Spark. Se representan dos etapas separadas por un shuffle. Sumar y guardar forman parte de la segunda etapa. La adquisición de recursos se muestra al inicio del trabajo para explicar los roles; las aplicaciones reales pueden adquirirlos antes y reutilizarlos. Los planes pueden variar por configuración y optimizaciones.

La aplicación no ejecuta Spark ni escribe archivos distribuidos reales. El CSV es un resultado de ejemplo calculado en el navegador. WebGL es necesario para la escena; las explicaciones y el registro de datos siguen disponibles si la vista 3D falla. En pantallas pequeñas, la escena se desplaza horizontalmente para mantener sus identificadores legibles.

Fuentes: https://spark.apache.org/docs/latest/cluster-overview.html y https://spark.apache.org/docs/latest/rdd-programming-guide.html
