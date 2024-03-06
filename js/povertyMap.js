class PovertyMap {

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, dispatcher) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 420,
        margin: _config.margin || {top: -100, right: 0, bottom: 0, left: 0},
        tooltipPadding: 10,
        legendBottom: 50,
        legendLeft: 50,
        legendRectHeight: 12, 
        legendRectWidth: 150
      }
      this.data = _data;
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
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement).append('svg')
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // Append group element that will contain our actual chart 
      // and position it according to the given margin config
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Initialize projection and path generator
      vis.projection = d3.geoAlbersUsa()
        .translate([vis.width / 2, vis.height / 2])
        .scale(vis.width);
      vis.geoPath = d3.geoPath().projection(vis.projection);
  
      vis.colorScale = d3.scaleLinear()
          .range(['#cfe2f2', '#0d306b'])
          .interpolate(d3.interpolateHcl);
  
  
      // Initialize gradient that we will later use for the legend
      vis.linearGradient = vis.svg.append('defs').append('linearGradient')
          .attr("id", "legend-gradient");
  
      // Append legend
      vis.legend = vis.chart.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
      
      vis.legendRect = vis.legend.append('rect')
          .attr('width', vis.config.legendRectWidth)
          .attr('height', vis.config.legendRectHeight);
  
      vis.legendTitle = vis.legend.append('text')
          .attr('class', 'legend-title')
          .attr('dy', '.35em')
          .attr('y', -10)
          .text(vis.data.feature1.feature_name)
  
      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;
  
      const poverty = d3.extent(vis.data.objects.counties.geometries, d => d.properties.poverty_perc);
      const poverty_no_null = d3.extent(vis.data.objects.counties.geometries, d => {
        if (d.properties.poverty_perc !== -1) {
            return d.properties.poverty_perc
        }});
      
      // Update color scale
      vis.colorScale.domain(poverty_no_null);
  
      // Define begin and end of the color gradient (legend)
      vis.legendStops = [
        { color: '#cfe2f2', value: poverty_no_null[0], offset: 0},
        { color: '#0d306b', value: poverty_no_null[1], offset: 100},
      ];

      vis.legendTitle.text(vis.data.feature1.feature_name)

      vis.addBrush();
  
      vis.renderVis();
    }
  
  
    renderVis(selectedData) {
      let vis = this;
  
      dispatcher.on('scatterPlotBrush', selectedData => {
        this.renderVis(selectedData)
      });

      if (! selectedData){
        selectedData = []
      }
      const selectedIds = selectedData.map(element => element.id);

      // Convert compressed TopoJSON to GeoJSON format
      const counties = topojson.feature(vis.data, vis.data.objects.counties)
      // const highlightedCounties = counties.features.filter(feature => feature.properties.name == "Hamilton")
      const highlightedCounties = counties.features.filter(feature => selectedIds.includes(feature.properties.id))
      const highlightedIds = highlightedCounties.map(element => element.properties.id)

      // Defines the scale of the projection so that the geometry fits within the SVG area
      vis.projection.fitSize([vis.width, vis.height], counties);
  
      // Append world map
      const countyPath = vis.chart.selectAll('.county')
          .data(counties.features)
        .join('path')
          .attr('class', 'county')
          .attr('d', vis.geoPath)
          .attr('fill', d => {
            if (d.properties.poverty_perc) {
              return vis.colorScale(d.properties.poverty_perc);
            } else {
              return 'url(#lightstripe)';
            }
          })
          .style('stroke', d => {
            if (highlightedIds.includes(d.properties.id)){
              return '#333';
            } else {
              return 'none';
            }
          })
          .style('stroke-width', d => {
            if (highlightedIds.includes(d.properties.name)){
              return '2px';
            } else {
              return '1px';
            }
          }); // Thicker stroke
  
      countyPath
          .on('mousemove', (event,d) => {
            const povertyPerc = d.properties.poverty_perc ? `<strong>${d.properties.poverty_perc}</strong>${vis.data.feature1.tooltip_desc}` : 'No data available'; 
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.properties.name}</div>
                <div>${povertyPerc}</div>
              `);
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });
  
      // Add legend labels
      vis.legend.selectAll('.legend-label')
          .data(vis.legendStops)
        .join('text')
          .attr('class', 'legend-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('y', 20)
          .attr('x', (d,index) => {
            return index == 0 ? 0 : vis.config.legendRectWidth;
          })
          .text(d => Math.round(d.value * 10 ) / 10);
  
      // Update gradient for legend
      vis.linearGradient.selectAll('stop')
          .data(vis.legendStops)
        .join('stop')
          .attr('offset', d => d.offset)
          .attr('stop-color', d => d.color);
  
      vis.legendRect.attr('fill', 'url(#legend-gradient)');
    }

    addBrush() {
      let vis = this;

      // Create a brush
      const brush = d3.brush()
          .extent([[0, 0], [vis.width, vis.height]])
          .on("end", brushed);

      // Append brush to the chart
      vis.brush = vis.chart.append("g")
          .attr("class", "brush")
          .call(brush);

      function brushed(event) {
          if (!event.selection) return; // Ignore empty selections
          const [[x0, y0], [x1, y1]] = event.selection;
          // Retrieve data within the brushed area and emit an event with the selected data
          const selectedData = vis.getSelectedData(x0, y0, x1, y1);
          vis.dispatcher.call("mapBrush", null, selectedData);
      }
  }

  // Method to retrieve data within the brushed area
  getSelectedData(x0, y0, x1, y1) {
    const vis = this;

    // Initialize an array to store selected counties
    const selectedCounties = [];

    // Iterate over each county
    vis.chart.selectAll('.county').each(function(d) {
        const county = d3.select(this);
        const centroid = vis.geoPath.centroid(d); // Get the centroid of the county

        // Check if the centroid falls within the selection bounds
        if (centroid[0] >= x0 && centroid[0] <= x1 && centroid[1] >= y0 && centroid[1] <= y1) {
            selectedCounties.push(d);
        }
    });
    return selectedCounties;
  }
  }

  