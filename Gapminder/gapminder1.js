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

// 9. Titulo para la gráfica
year_display = g
                .append('text')
                .attr('x', ancho/2)
                .attr('y', alto/2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '140px')
                .attr('font-family', 'roboto condensed')
                .attr('fill', '#CCCCCC')

// 5. Escalador ordinal para los continentes
continentColor = d3
                  .scaleOrdinal()
                  .domain(['asia', 'americas', 'africa', 'europe'])
                  .range(['#ff0000', '#00ff00', '#0000ff', '#ffffff'])
// 6. Grupos para los ejes
xGroup = g
          .append('g')
          .attr('transform', `translate(0, ${alto})`)
yGroup = g.append('g')

// Objetivo:
//    Gráfica de burbujas donde en el eje de las X voy a tener el
//    PIB per capita en el Y la expectativa de vida y el ancho de
//    las burbujas será la población
function render(data, year) {

  data = data.filter((d) => d.year == year )
  console.log(data)

  // 2. Escaladores
  x = d3
        .scaleLog()
        .domain([1, d3.max(data, (d) => d.income)])
        .range([0, ancho])
  y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.life_exp)])
        .range([alto, 0])
  r = d3
        .scaleLinear()
        .domain([d3.min(data, (d) => d.population),
                d3.max(data, (d) => d.population)])
        .range([5, 50])

  // 7. Creamos los ejes
  xAxisCall = d3
                .axisBottom(x)
  xGroup.call(xAxisCall)

  yAxisCall = d3
                .axisLeft(y)
  yGroup.call(yAxisCall)

  // 10. Actualizamos el año
  year_display.text(year)

  // 3. join
  puntos = g
            .selectAll('circle')
            .data(data)

  // 4. Enter
  puntos
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.income))
        .attr('cy', (d) => y(d.life_exp))
        .attr('r', (d) => r(d.population))
        .attr('fill', (d) => continentColor(d.continent))
        .attr('fill-opacity', 0.5)
        .attr('stroke', 'black')

}

function load() {
  // 1. Cargar y limpiar los datos numericos a numericos
  d3.csv('/datos/gap.csv').then((data) => {
    data.forEach((d) => {
      d.income = +d.income
      d.life_exp = +d.life_exp
      d.year = +d.year
      d.population = +d.population
    })

    // 8. Eliminamos los datos que no están completos
    data = data.filter((d) => {
      return (d.income > 0) && (d.life_exp > 0)
    })

    continentes = d3
                    .map(data, (d) => d.continent)
                    .keys()

    console.log(continentes)

    render(data, 2014)
  })
}

load()