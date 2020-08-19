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

continentes = ['asia', 'americas', 'africa', 'europe']
continentesColor = ['#ff0000', '#00ff00', '#0000ff', '#ffffff']

continentColor = d3
                  .scaleOrdinal()
                  .domain(continentes)
                  .range(continentesColor)

ancho_leyenda = 110
alto_leyenda  = 100

leyenda = svg
            .append('g')
            .attr('transform', `translate(${ ancho_total - margin.right - ancho_leyenda }, ${ alto_total - margin.bottom - alto_leyenda })`)

leyenda
  .append('rect')
  .attr('x', -5)
  .attr('y', -5)
  .attr('width', ancho_leyenda)
  .attr('height', alto_leyenda)
  .attr('fill', '#ccc')
  .attr('stroke', 'black')

continentes.forEach((c, i) => {
  ren = leyenda
          .append('g')
          .attr('transform', `translate(0, ${ i * 20 })`)

  ren
    .append('rect')
    .attr('x', 5)
    .attr('y', 7)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', continentColor(c))

  ren
    .append('text')
    .attr('x', 25)
    .attr('y', 20)
    .attr('text-anchor', 'start')
    .style('text-transform', 'capitalize')
    .text(c)
})

xGroup = g
          .append('g')
          .attr('transform', `translate(0, ${alto})`)
yGroup = g.append('g')

x = d3.scaleLog()
y = d3.scaleLinear()
r = d3.scaleLinear()

var pausa = false
var interval
var years = []
var iyear = 0
var data  = []

botonPausa = d3.select('#botonpausa')
contValue  = d3.select('#continente')

yearSlider = d3.select('#year-slider')

ancho_slider = d3
                .select('#slider-container')
                .style('width').slice(0, -2)
slider = d3
          .sliderHorizontal()
          .step(1)
          .ticks(5)
          .width(ancho_slider - 100)
          .displayValue(true)

// Objetivo:
//    Gráfica de burbujas donde en el eje de las X voy a tener el
//    PIB per capita en el Y la expectativa de vida y el ancho de
//    las burbujas será la población
function render(data, year) {

  data = data.filter((d) => {
    c = contValue.node().value

    return (c == 'todos') ? d.year == year : (d.year == year) && (d.continent == c)
  })

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
          .attr('r', 0)
          .attr('fill', 'black')
        .merge(puntos)
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
        .attr('r', 0)
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

    iyear = 0
    years = d3
              .map(data, (d) => d.year)
              .keys()

    yearSlider
        .attr('min', 0)
        .attr('max', years.length-1)
    yearSlider.node().value = 0

    slider
        .min(years[0])
        .max(years[years.length-1])
    yearSlider
        .append('svg')
        .attr('width', ancho_slider-20)
        .attr('height', 50)
        .append('g')
        .attr('transform', `translate(1'. 30)`)
        .call(slider)

    this.data = data
    step(data)
    interval = d3.interval((d) => { step(data) }, 500)
  })
}

function step(data) {
  render(data, +years[iyear++])
  iyear %= years.length
}

load()

botonPausa.on('click', () => {
  if (pausa) {
    botonPausa
      .classed('btn-danger', true)
      .classed('btn-success', false)
      .html('<i class="fa fa-pause"></i> Pausa ')
      interval = d3.interval((d) => { step(data) }, 500)
  } else {
    botonPausa
      .classed('btn-danger', false)
      .classed('btn-success', true)
      .html('<i class="fa fa-play"></i> Continuar ')
    interval.stop()
  }
  pausa = !pausa
})

contValue.on('change', () => {
  render(data, +years[iyear])
})

slider.on('onchange', (value) => {
  render(data, value)
})
slider.on('start', () => {
  interval.stop()
})
slider.on('end', () => {
  iyear = years.findIndex(val => val == slider.value())
  if (!pausa) {
    interval = d3.interval((d) => { step(data) }, 500)
  }
})
