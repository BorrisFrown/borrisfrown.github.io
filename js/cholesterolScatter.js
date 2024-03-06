class CholesterolScatter {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 600,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 35},
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }
    this.data = _data;
    const good_data = this.data.objects.counties.geometries.map(element => element.properties);
    this.good_data = good_data;
    this.dispatcher = dispatcher;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(-vis.height - 10)
        .tickPadding(10)
        .tickFormat(d => d);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSize(-vis.width - 10)
        .tickPadding(10);

    // Assign scales to axes
      vis.xAxis.scale(vis.xScale);
      vis.yAxis.scale(vis.yScale);


    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Append both axis titles
    vis.chart.append('text')
        .attr('class', 'axis-title x-axis-title')
        .attr('y', vis.height - 15)
        .attr('x', vis.width + 10)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text(vis.data.feature2.feature_name);

    vis.svg.append('text')
        .attr('class', 'axis-title y-axis-title')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '.71em')
        .text(vis.data.feature1.feature_name);

    vis.updateVis()
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;
    
    // Filter out data points with -1 values for both percent_high_cholesterol and poverty_perc
    vis.good_data = vis.data.objects.counties.geometries
    .map(element => element.properties)
    .filter(d => d.percent_high_cholesterol !== -1 && d.poverty_perc !== -1 && d.poverty_perc != undefined);

    // Set the scale input domains using the filtered data
    vis.xScale.domain([0, d3.max(vis.good_data, d => d.percent_high_cholesterol)]);
    vis.yScale.domain([0, d3.max(vis.good_data, d => d.poverty_perc)]);

    // Specificy accessor functions
    vis.xValue = d => d.percent_high_cholesterol;
    vis.yValue = d => d.poverty_perc;


    vis.xScale.domain([d3.min(vis.good_data, vis.xValue), d3.max(vis.good_data, vis.xValue)]);
    vis.yScale.domain([d3.min(vis.good_data, vis.yValue), d3.max(vis.good_data, vis.yValue)]);

    // Update the axis titles
    vis.svg.select('.x-axis-title')
        .text(vis.data.feature2.feature_name);
    
    vis.svg.select('.y-axis-title')
        .text(vis.data.feature1.feature_name);

    vis.addBrush();

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis(selectedData) {
    let vis = this;

    dispatcher.on('mapBrush', selectedData => {
      this.renderVis(selectedData)
    })

    if (! selectedData){
      selectedData = []
    }

    function noselection(selectedData, vis) {
      if (selectedData.length === 0) {
        return vis.good_data;
      } else {
        vis.svg.selectAll('.point').remove()
        const selectedIds = selectedData.map(element => element.properties.id)
        const highlightedCounties = vis.good_data.filter(feature => selectedIds.includes(feature.id))
        console.log(highlightedCounties)
        return highlightedCounties || [];
      }
    }

    console.log(vis.good_data)
    
    // Add circles
    // console.log(vis.good_data)
    // console.log(selectedData)
    
    const circles = vis.chart.selectAll('.point')
        .data(vis.good_data)
        .join('circle')
        .attr('class', 'point')
        .attr('r', 4)
        .attr('cy', d => vis.yScale(vis.yValue(d)))
        .attr('cx', d => vis.xScale(vis.xValue(d)));

    // Tooltip event listeners
    circles
        .on('mouseover', (event,d) => {
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.name}</div>
              <div><i>${d.name}</i></div>
              <ul>
                <li>${d.percent_high_cholesterol}${vis.data.feature2.tooltip_desc}</li>
                <li>${d.poverty_perc}${vis.data.feature1.tooltip_desc}</li>
              </ul>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });
    
    // Update the axes/gridlines
    // We use the second .call() to remove the axis and just show gridlines
    vis.xAxisG
        .call(vis.xAxis)
        .call(g => g.select('.domain').remove());

    vis.yAxisG
        .call(vis.yAxis)
        .call(g => g.select('.domain').remove())
  }

  addBrush() {
    let vis = this;

    // Create brush
    vis.brush = d3.brush()
        .extent([[0, 0], [vis.width, vis.height]])
        .on("brush end", brushed);

    // Append brush to chart
    vis.brushG = vis.chart.append("g")
        .attr("class", "brush")
        .call(vis.brush);

        function brushed(event) {
          const selection = event.selection;
  
          if (selection) {
              const [[x0, y0], [x1, y1]] = selection;
              const selectedData = vis.good_data.filter(d =>
                  vis.xScale(vis.xValue(d)) >= x0 &&
                  vis.xScale(vis.xValue(d)) <= x1 &&
                  vis.yScale(vis.yValue(d)) >= y0 &&
                  vis.yScale(vis.yValue(d)) <= y1
              );

              // console.log("Selected data:", selectedData);
  
              // Emit custom event to notify other visualizations of the selected data
              vis.dispatcher.call('scatterPlotBrush', null, selectedData);
          } else {
              // If brush is cleared, emit custom event with null selection
              vis.dispatcher.call('scatterPlotBrush', null, null);
          }
      }
  }
}