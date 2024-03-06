console.log("hello world!");

const dispatcher = d3.dispatch('scatterPlotBrush', 'mapBrush');

//we will fill this in, based on the data
let minYear = 99999; 
let maxYear = 0; 
let years = [];
 
Promise.all([
	d3.json('data/counties.json'),
	d3.csv('data/national_health_data.csv'),
	d3.json('data/feature.json')
]).then(data => {
  	console.log('Data loading complete. Work with dataset.');
    console.log(data);
	const counties = data[0];
	const health = data[1];
	const features = data[2];

	document.getElementById('primary-select').addEventListener('change', function() {
		updateVisualizations();
	});

	document.getElementById('secondary-select').addEventListener('change', function() {
		updateVisualizations();
	});
	  
	const poverty = health.map(d => d.poverty_perc);
	const cholesterol = health.map(d => d.percent_high_cholesterol);
	dataConsolidation(poverty, cholesterol, 'poverty_perc', 'percent_high_cholesterol')

	// Dataset combination
	function dataConsolidation(d1, d2, id1, id2){
		counties.feature1 = features.find(d => d.feature_id === id1);
		counties.feature2 = features.find(d => d.feature_id === id2);
		counties.objects.counties.geometries.forEach(d => {
			for (let i = 0; i < health.length; i++){
				if (d.id == health[i].cnty_fips) {
					d.properties.poverty_perc = +d1[i];
					d.properties.percent_high_cholesterol = +d2[i];
					d.properties.id = +health[i].cnty_fips;
				}
			}
		});
	}

	function updateVisualizations() {
		const primary = document.getElementById('primary-select').value;
		const secondary = document.getElementById('secondary-select').value;

		let newData1, newData2;

		if (primary == 'poverty_perc') {
			newData1 = health.map(d => d.poverty_perc);
		} else if (primary == 'median_household_income') {
			newData1 = health.map(d => d.median_household_income);
		} else if (primary == 'education_less_than_high_school_percent') {
			newData1 = health.map(d => d.education_less_than_high_school_percent);
		} else if (primary == 'air_quality') {
			newData1 = health.map(d => d.air_quality);
		} else if (primary == 'park_access') {
			newData1 = health.map(d => d.park_access);
		} else if (primary == 'percent_inactive') {
			newData1 = health.map(d => d.percent_inactive);
		} else if (primary == 'percent_smoking') {
			newData1 = health.map(d => d.percent_smoking);
		} else if (primary == 'elderly_percentage') {
			newData1 = health.map(d => d.elderly_percentage);
		} else if (primary == 'number_of_hospitals') {
			newData1 = health.map(d => d.number_of_hospitals);
		} else if (primary == 'number_of_primary_care_physicians') {
			newData1 = health.map(d => d.number_of_primary_care_physicians);
		} else if (primary == 'percent_no_heath_insurance') {
			newData1 = health.map(d => d.percent_no_heath_insurance);
		} else if (primary == 'percent_high_blood_pressure') {
			newData1 = health.map(d => d.percent_high_blood_pressure);
		} else if (primary == 'percent_coronary_heart_disease') {
			newData1 = health.map(d => d.percent_coronary_heart_disease);
		} else if (primary == 'percent_stroke') {
			newData1 = health.map(d => d.percent_stroke);
		} else if (primary == 'percent_high_cholesterol') {
			newData1 = health.map(d => d.percent_high_cholesterol);
		} 

		if (secondary == 'percent_high_cholesterol') {
			newData2 = health.map(d => d.percent_high_cholesterol);
		} else if (secondary == 'poverty_perc') {
			newData2 = health.map(d => d.poverty_perc);
		} else if (secondary == 'median_household_income') {
			newData2 = health.map(d => d.median_household_income);
		} else if (secondary == 'education_less_than_high_school_percent') {
			newData2 = health.map(d => d.education_less_than_high_school_percent);
		} else if (secondary == 'air_quality') {
			newData2 = health.map(d => d.air_quality);
		} else if (secondary == 'park_access') {
			newData2 = health.map(d => d.park_access);
		} else if (secondary == 'percent_inactive') {
			newData2 = health.map(d => d.percent_inactive);
		} else if (secondary == 'percent_smoking') {
			newData2 = health.map(d => d.percent_smoking);
		} else if (secondary == 'elderly_percentage') {
			newData2 = health.map(d => d.elderly_percentage);
		} else if (secondary == 'number_of_hospitals') {
			newData2 = health.map(d => d.number_of_hospitals);
		} else if (secondary == 'number_of_primary_care_physicians') {
			newData2 = health.map(d => d.number_of_primary_care_physicians);
		} else if (secondary == 'percent_no_heath_insurance') {
			newData2 = health.map(d => d.percent_no_heath_insurance);
		} else if (secondary == 'percent_high_blood_pressure') {
			newData2 = health.map(d => d.percent_high_blood_pressure);
		} else if (secondary == 'percent_coronary_heart_disease') {
			newData2 = health.map(d => d.percent_coronary_heart_disease);
		} else if (secondary == 'percent_stroke') {
			newData2 = health.map(d => d.percent_stroke);
		} 
		// Call the dataConsolidation function with the new data
		dataConsolidation(newData1, newData2, primary, secondary);

		// Update each visualization with the new data
		povertyMap.updateVis();
		cholesterolMap.updateVis();
		povertyHistogram.updateVis();
		cholesterolHistogram.updateVis();
		cholesterolScatter.updateVis();
	}


	const svg = d3.select('body').append('svg')
	    .attr('width', 1000)
	    .attr('height', 1100);

	const povertyMap = new PovertyMap({
		parentElement: '#map'
	}, data[0], dispatcher);

	const cholesterolMap = new CholesterolMap({
		parentElement: '#map'
	}, data[0], dispatcher);

	const povertyHistogram = new PovertyHistogram({
		parentElement: '#histogram'
	}, data[0])

	const cholesterolHistogram = new CholesterolHistogram({
		parentElement: '#histogram'
	}, data[0])

	// const povertyScatter = new PovertyScatter({
	// 	parentElement: '#scatter'
	// }, data[0])

	const cholesterolScatter = new CholesterolScatter({
		parentElement: '#scatter'
	}, data[0], dispatcher)

  })
  .catch(error => {
    console.error(error);
  });

  dispatcher.on('scatterPlotBrush', selectedData => {
	// console.log(selectedData)
	// cholesterolMap.updateVis(selectedData);
  });

