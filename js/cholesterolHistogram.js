class CholesterolHistogram {
  constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 400,
        margin: _config.margin || {top: 10, right: 0, bottom: 0, left: 0},
        tooltipPadding: 10,
      }
      this.data = _data;
      this.initVis();
    }

    initVis() {
      let vis = this;

      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

      vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

      vis.updateVis();
    }

    updateVis(){
      let vis = this;

      vis.renderVis();
    }

    renderVis() {
      let vis = this;

      vis.svg.selectAll("*").remove();

      // set the dimensions and margins of the graph
      const margin = {top: 10, right: 30, bottom: 30, left: 40},
        width = vis.config.containerWidth - margin.left - margin.right,
        height = vis.config.containerHeight - margin.top - margin.bottom;

      // X axis: scale and draw:
      const x = d3.scaleLinear()
      // .domain([0, 75])
      .domain([0, d3.max(vis.data.objects.counties.geometries, d => { return d.properties.percent_high_cholesterol })])
          .range([0, width]);
      vis.svg.append("g")
          .attr("transform", `translate(${margin.left}, ${height})`)
          .call(d3.axisBottom(x));

      
      // set the parameters for the histogram
      const histogram = d3.histogram()
      .value(function(d) { 
        return d.properties.percent_high_cholesterol; // Accessing the correct property
      })
          .domain(x.domain())  // then the domain of the graphic
          .thresholds(x.ticks(70)); // then the numbers of bins

      // And apply this function to data to get the bins
      const data_no_null = vis.data.objects.counties.geometries.filter(function(d) {
        return d.properties.percent_high_cholesterol !== -1; // Filtering out data points with percent_high_cholesterol equal to -1
      });
    
    const bins = histogram(data_no_null);

      // Y axis: scale and draw:
      const y = d3.scaleLinear()
          .range([height, 0]);
          y.domain([0, d3.max(bins, d => d.length)]);
        vis.svg.append("g")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(d3.axisLeft(y)
          .ticks(10));

      // append the bar rectangles to the svg element
      vis.svg.selectAll("rect")
          .data(bins)
          .join("rect")
          .attr("x", d => x(d.x0) + margin.left) // Adjusted to include left margin
          .attr("width", d => x(d.x1) - x(d.x0) - 1)
          .attr("y", d => y(d.length))
          .attr("height", d => height - y(d.length))
          .style("fill", "#69b3a2");


    }
}