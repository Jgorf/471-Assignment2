
const margin = { top: 40, right: 50, bottom: 60, left: 90 };
const chartHeight = 450;
const chartWidth = 600;
const width = chartWidth - margin.left - margin.right;
const height = chartHeight - margin.top - margin.bottom;

let allData = [];
let xScaleline, yScaleline;

const countries = [
    'Albania',
    'Armenia',
    'Azerbaijan',
    'Bangladesh',
    'Burkina Faso',
    'China',
    'Costa Rica',
    'Georgia',
    'Ghana',
    'Hong Kong SAR, China',
    'India',
    'Kazakhstan',
    'Macao SAR, China',
    'Malaysia',
    'Moldova',
    'Morocco',
    'Nepal',
    'Qatar',
    'Rwanda',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Sri Lanka',
    'Tunisia',
    'Uzbekistan'
];

const svgLine = d3.select('#visWhite')
    .append('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight + 20)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

function init() {
    d3.csv('data/gender.csv', (d) => {
        return {
            country: d['Country Name'],
            year: +d.Year,
            female: d['average_value_School enrollment, tertiary, female (% gross)'] === ''
                ? null : +d['average_value_School enrollment, tertiary, female (% gross)'],
            male: d['average_value_School enrollment, tertiary, male (% gross)'] === ''
                ? null : +d['average_value_School enrollment, tertiary, male (% gross)']
        };
    })
        .then(data => {
            allData = data;

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', height + margin.bottom - 10)
                .style('text-anchor', 'middle')
                .text('Year');

            svgLine.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -height / 2)
                .attr('y', -60)
                .style('text-anchor', 'middle')
                .text('Average Gross Tertiary Enrollment Rate (%)');

            updateVisLine();
        })
        .catch(error => console.error('Error loading data:', error));
}

function updateVisLine() {
    let currentData = allData.filter(d =>
        countries.includes(d.country) &&
        d.year >= 2016 &&
        d.year <= 2019 &&
        d.female != null &&
        d.male != null
    );

    let countedData = [];
    for (let year = 2016; year <= 2019; year++) {
        let yearData = currentData.filter(d => d.year === year);

        countedData.push({
            year: year,
            female: d3.mean(yearData, d => d.female),
            male: d3.mean(yearData, d => d.male),
            count: yearData.length
        });
    }
    console.log(countedData);

    xScaleline = d3.scaleLinear()
        .domain([2016, 2019])
        .range([0, width]);

    yScaleline = d3.scaleLinear()
        .domain([0, 65])
        .range([height, 0]);

    const femaleLine = d3.line()
        .x(d => xScaleline(d.year))
        .y(d => yScaleline(d.female));

    const maleLine = d3.line()
        .x(d => xScaleline(d.year))
        .y(d => yScaleline(d.male));

    svgLine.selectAll('.linemade, .axis, .point, .legend, .grid').remove();

    svgLine.append('g')
        .attr('class', 'grid')
        .call(
            d3.axisLeft(yScaleline)
                .tickValues([0, 10, 20, 30, 40, 50, 60])
                .tickSize(-width)
                .tickFormat('')
        )
        .selectAll('line')
        .style('stroke', 'lightgrey')
        .style('stroke-width', 1);

    svgLine.select('.grid path')
        .style('stroke', 'none');

    svgLine.append('path')
        .datum(countedData)
        .attr('class', 'linemade')
        .attr('d', femaleLine)
        .attr('fill', 'none')
        .style('stroke', '#fe89bd')
        .style('stroke-width', 3);

    svgLine.append('path')
        .datum(countedData)
        .attr('class', 'linemade')
        .attr('d', maleLine)
        .attr('fill', 'none')
        .style('stroke', '#90c5f1')
        .style('stroke-width', 3);

    ['female', 'male'].forEach(gender => {

        const color = gender === 'female' ? '#fe89bd' : '#90c5f1';

        svgLine.selectAll(`.point-${gender}`)
            .data(countedData)
            .enter()
            .append('circle')
            .attr('class', `point point-${gender}`)
            .attr('cx', d => xScaleline(d.year))
            .attr('cy', d => yScaleline(d[gender]))
            .attr('r', 5)
            .attr('fill', color)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('r', 7);

                d3.select('#tooltip')
                    .style('display', 'block')
                    .html(`
                        <strong>${d.year}</strong><br>
                        Gender: ${gender === 'female' ? 'Female' : 'Male'}<br>
                        Average enrollment rate: ${d[gender].toFixed(2)}%<br>
                    `);
            })
            .on('mousemove', function (event) {
                d3.select('#tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).attr('r', 5);
                d3.select('#tooltip').style('display', 'none');
            });
    });

    const xAxis = d3.axisBottom(xScaleline)
        .tickValues([2016, 2017, 2018, 2019])
        .tickFormat(d3.format('d'));

    const yAxis = d3.axisLeft(yScaleline)
        .tickValues([0, 10, 20, 30, 40, 50, 60])
        .tickFormat(d => d + '%');

    svgLine.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    svgLine.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    const legend = svgLine.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 30},10)`);

    const legendData = [
        { name: 'Female', color: '#fe89bd' },
        { name: 'Male', color: '#90c5f1' }
    ];

    legendData.forEach((d, i) => {
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', i * 25)
            .attr('y2', i * 25)
            .style('stroke', d.color)
            .style('stroke-width', 3);

        legend.append('text')
            .attr('x', 35)
            .attr('y', i * 25 + 4)
            .text(d.name);
    });
}

window.addEventListener('load', init);