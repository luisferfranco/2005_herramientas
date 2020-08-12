ancho_total = d3.select('#grafica').style('width').slice(0,-2)
alto_total  = ancho_total * 9 / 16
margin = { left: 75, right: 10, top: 50, bottom: 75 }

ancho = ancho_total - margin.left - margin.right
alto  = alto_total - margin.top - margin.bottom


svg = d3
        .select('#grafica')
        .append('svg')
        .attr('width', ancho_total)
        .attr('height', alto_total)
        .classed('graf', true)

g = svg
      .append('g')
      .attr('width', ancho_total - margin.left - margin.right)
      .attr('height', alto_total - margin.top - margin.bottom)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

year_display = g
                .append('text')
                .attr('x', ancho/2)
                .attr('y', alto/2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '140px')
                .attr('font-family', 'roboto condensed')
                .attr('fill', '#CCCCCC')

continentColor = d3
                  .scaleOrdinal()
                  .domain(['asia', 'americas', 'africa', 'europe'])
                  .range(['#ff0000', '#00ff00', '#0000ff', '#ffffff'])
xGroup = g
          .append('g')
          .attr('transform', `translate(0, ${alto})`)
yGroup = g.append('g')

// 1. Declaramos los escaladores como variables globales
x = d3.scaleLog()
y = d3.scaleLinear()
r = d3.scaleLinear()

// Objetivo:
//    Gráfica de burbujas donde en el eje de las X voy a tener el
//    PIB per capita en el Y la expectativa de vida y el ancho de
//    las burbujas será la población
function render(data, year) {

  data = data.filter((d) => d.year == year )
  console.log(data)

  xAxisCall = d3
                .axisBottom(x)
                .tickFormat(function (d) {
                  return x.tickFormat(4, d3.format(",d"))(d)
                })
  xGroup.call(xAxisCall)

  yAxisCall = d3
                .axisLeft(y)
  yGroup.call(yAxisCall)

  year_display.text(year)

  // 8. Decimos que d3 siga los nombres de cada punto y no solo
  //    el orden en que llegan
  puntos = g
            .selectAll('circle')
            .data(data, (d) => d.country)


  puntos
        .enter()
        .append('circle')
          .attr('cx', (d) => x(d.income))
          .attr('cy', (d) => y(d.life_exp))
          .attr('r', 100)
          .attr('fill', 'black')
        // 6. Añadimos un merge() para todos los puntos que
        //    cambian
        .merge(puntos)
          // 7. Se añade una transición para los puntos
          //    (animación)
          .transition()
          .duration(300)
          .attr('cx', (d) => x(d.income))
          .attr('cy', (d) => y(d.life_exp))
          .attr('r', (d) => r(d.population))
          .attr('fill', (d) => continentColor(d.continent))
          .attr('fill-opacity', 0.5)
          .attr('stroke', 'black')

  puntos
        .exit()
        .transition()
        .duration(300)
        .attr('r', 100)
        .attr('fill', 'red')
        .remove()

}

function load() {
  d3.csv('/datos/gap.csv').then((data) => {
    data.forEach((d) => {
      d.income = +d.income
      d.life_exp = +d.life_exp
      d.year = +d.year
      d.population = +d.population
    })

    data = data.filter((d) => {
      return (d.income > 0) && (d.life_exp > 0)
    })

    // 2. Poner los dominios y rangos de los escaladores
    x
      .domain([d3.min(data, (d) => d.income),
                d3.max(data, (d) => d.income)])
      .range([0, ancho])

    y
      .domain([d3.min(data, (d) => d.life_exp),
                d3.max(data, (d) => d.life_exp)])
      .range([alto, 0])

    r
      .domain([d3.min(data, (d) => d.population),
              d3.max(data, (d) => d.population)])
      .range([5, 50])

    // 3. indice para los años (iyear)
    iyear = 0

    // 4. Un arreglo de strings de todos los años
    years = d3
              .map(data, (d) => d.year)
              .keys()
    console.log(years)

    // 5. Creamos el intervalo de animación
    d3.interval((d) => {
      render(data, +years[iyear++])
      iyear %= years.length
    }, 500)
  })
}

load()