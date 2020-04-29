/**
 * Main file allowing the draw the graphics.
 *
 */
(function (d3) {
  "use strict";

  /***** Configuration *****/
  // load label to names mapping for visualization purposes
  var objectTypes = [
    'person', 'bicycle', 'car', 'motorcycle', 'bus', 
    'train', 'truck', 'backpack', 'handbag', 'skateboard'
  ];
  // Error types for assessing the difference between the frame-level score and ground-truth
  var errorTypes = [
    {name: "Absolute difference between score and ground-truth", abbreviation: "AE"},
    {name: "Squared difference between score and ground-truth", abbreviation: "SE"}
  ];

  var currentData, currentVideo, currentMethod, currentClassifier, currentErrorType;
  var videoImagePosX, videoImagePosY, videoImageHeight, videoImageWidth;
  var videoAlpha, videoBeta;
  var videoX, videoY;
  var videoFPS, videoImageDuration;

  var videoPanel = d3.select("#panel");

  var videoPlayerMargin = {
    top: 0,
    right: 20,
    bottom: 20,
    left: 20
  };
  var videoPlayerWidth = 980 - videoPlayerMargin.left - videoPlayerMargin.right;
  var videoPlayerHeight = 600 - videoPlayerMargin.top - videoPlayerMargin.bottom;

  videoBeta = videoPlayerWidth / videoPlayerHeight;

  // Configuration for SVG elements inside the video panel
  var barChartMargin = {
    top: 5,
    right: 20,
    bottom: 5,
    left: 40
  };
  var barChartWidth = 300 - barChartMargin.left - barChartMargin.right;
  var barChartHeight = 200 - barChartMargin.top - barChartMargin.bottom;

  var regionImagesMargin = {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  };
  var regionImagesWidth = 148 - regionImagesMargin.left - regionImagesMargin.right;
  var regionImagesHeight = 148 - regionImagesMargin.top - regionImagesMargin.bottom;

  var swarmPlotMargin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  };
  var swarmPlotWidth = 980 - swarmPlotMargin.left - swarmPlotMargin.right;
  var swarmPlotHeight = 700 - swarmPlotMargin.top - swarmPlotMargin.bottom;

  /***** Create SVG elements *****/
  var videoPlayerSvg = d3.select("#video-player-svg")
    .attr("width", videoPlayerWidth + videoPlayerMargin.left + videoPlayerMargin.right)
    .attr("height", videoPlayerHeight + videoPlayerMargin.top + videoPlayerMargin.bottom);
  var videoPlayerGroup = videoPlayerSvg.append("g")
    .attr("transform", "translate(" + videoPlayerMargin.left + "," + videoPlayerMargin.top + ")");

  // Create SVG elements inside the panel
  var barChartSvg = videoPanel.select("#bar-chart-svg")
    .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
    .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom);
  var barChartGroup = barChartSvg.append("g")
    .attr("transform", "translate(" + barChartMargin.left + "," + barChartMargin.top + ")");
  var barChartBarsGroup = barChartGroup.append("g");
  var barChartAxisGroup = barChartGroup.append("g").attr("class", "axis y bar");

  var realAppearSvg = videoPanel.select("#region-real-appear-svg")
    .attr("width", regionImagesWidth + regionImagesMargin.left + regionImagesMargin.right)
    .attr("height", regionImagesHeight + regionImagesMargin.top + regionImagesMargin.bottom);
  var realAppearGroup = realAppearSvg.append("g")
    .attr("transform", "translate(" + regionImagesMargin.left + "," + regionImagesMargin.top + ")");
  
  var fakeAppearSvg = videoPanel.select("#region-fake-appear-svg")
    .attr("width", regionImagesWidth + regionImagesMargin.left + regionImagesMargin.right)
    .attr("height", regionImagesHeight + regionImagesMargin.top + regionImagesMargin.bottom);
  var fakeAppearGroup = fakeAppearSvg.append("g")
    .attr("transform", "translate(" + regionImagesMargin.left + "," + regionImagesMargin.top + ")");

  var realMotionSvg = videoPanel.select("#region-real-motion-svg")
    .attr("width", regionImagesWidth + regionImagesMargin.left + regionImagesMargin.right)
    .attr("height", regionImagesHeight + regionImagesMargin.top + regionImagesMargin.bottom);
  var realMotionGroup = realMotionSvg.append("g")
    .attr("transform", "translate(" + regionImagesMargin.left + "," + regionImagesMargin.top + ")");

  var fakeMotionSvg = videoPanel.select("#region-fake-motion-svg")
    .attr("width", regionImagesWidth + regionImagesMargin.left + regionImagesMargin.right)
    .attr("height", regionImagesHeight + regionImagesMargin.top + regionImagesMargin.bottom);
  var fakeMotionGroup = fakeMotionSvg.append("g")
    .attr("transform", "translate(" + regionImagesMargin.left + "," + regionImagesMargin.top + ")");
  
  var swarmPlotSvg = d3.select("#swarm-plot-svg")
    .attr("width", swarmPlotWidth + swarmPlotMargin.left + swarmPlotMargin.right)
    .attr("height", swarmPlotHeight + swarmPlotMargin.top + swarmPlotMargin.bottom);
  var swarmPlotGroup = swarmPlotSvg.append("g")
    .attr("transform", "translate(" + swarmPlotMargin.left + "," + swarmPlotMargin.top + ")");
  
  videoPlayerGroup.append("rect")
    .attr("class", "video")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", videoPlayerHeight)
    .attr("width", videoPlayerWidth);
  
  realAppearGroup.append("rect")
    .attr("class", "border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", regionImagesHeight)
    .attr("width", regionImagesWidth);
  
  fakeAppearGroup.append("rect")
    .attr("class", "border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", regionImagesHeight)
    .attr("width", regionImagesWidth);
  
  realMotionGroup.append("rect")
    .attr("class", "border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", regionImagesHeight)
    .attr("width", regionImagesWidth);
  
  fakeMotionGroup.append("rect")
    .attr("class", "border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", regionImagesHeight)
    .attr("width", regionImagesWidth);
  
  /***** Scales *****/
  var colorObjects = d3.scaleOrdinal(d3.schemeCategory10);
  var colorScore = d3.scaleLinear().range(['blue', 'red']);
  var xBarChart = d3.scaleLinear().range([0, barChartWidth]);
  var yBarChart = d3.scaleBand().range([0, barChartHeight]).padding(0.1);
  var xSwarmPlot = d3.scaleLinear().range([0, swarmPlotWidth]);
  var ySwarmPlot = d3.scaleBand().range([swarmPlotHeight, 0]).padding(0.1);
  var rSwarmPlot = d3.scaleSqrt().range([3, 5]);

  var yAxisBarChart = d3.axisLeft(yBarChart);
  var xAxisSwarmPlot = d3.axisBottom(xSwarmPlot);
  var yAxisSwarmPlot = d3.axisLeft(ySwarmPlot);

  // tip for regions and bars
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0]);
  // tip for frame
  var tipFrame = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, -200]);

  // Specify the color domain
  colorObjects.domain(objectTypes);
  colorScore.domain([0, 1])

  // Specify the x domain for bar chart
  xBarChart.domain([0, 1]);

  // Specify the x domain for swarm plot
  xSwarmPlot.domain([0, 1]);
  
  /***** Information panel management *****/
  videoPanel.select("button")
    .on("click", function () {
      videoPanel.classed("display", false);
    });

  d3.select("#stop-circles-button")
    .on("click", function () {
      stopOperation();
    });
  
  d3.select("#play-circles-button")
    .on("click", function () {
      playOperation();
    });
  
  d3.select("#reset-circles-button")
    .on("click", function () {
      resetOperation();
    });
  
  /***** Tabs *****/
  var tabs = d3.selectAll(".tabs li");
  tabs.on("click", function (d, i) {
    var self = this;
    var index = i;
    resetOperation();
    tabs.classed("active", function () {
      return self === this;
    });
    d3.selectAll(".tabs .tab")
      .classed("visible", function (d, i) {
        return index === i;
      });
  });

  /***** Load data *****/
  d3.json("./data/datasets.json").then(function (data) {
    currentData = data[0];
    currentVideo = currentData.videos[0];
    currentMethod = currentData.models[0];
    currentClassifier = currentMethod.classifiers[0];

    // Add datasets
    d3.select("#dataset-select")
      .on("change", function () {
        currentData = data[+d3.select(this).property("value")];
        currentVideo = currentData.videos[0];
        currentMethod = currentData.models[0];
        currentClassifier = currentMethod.classifiers[0];
        // Clear previous options
        d3.select("#video-select").selectAll("option").remove();
        d3.select("#method-select").selectAll("option").remove();
        d3.select("#classifier-select").selectAll("option").remove();
        // Add options
        addOptions();
        // Reset the video
        resetOperation();
      })
      .selectAll("option")
      .data(data)
      .enter()
      .append("option")
      .attr("value", (d, i) => i)
      .text(d => d.name);
    
    // Add options
    addOptions();
    // Reset the video
    resetOperation();

    /***** Tooltip creation *****/
    tip.html(d => getBBoxToolTipText.call(this, d));
    videoPlayerGroup.call(tip);
    barChartBarsGroup.call(tip);
    tipFrame.html(d => getFrameToolTipText.call(this, d));
    videoPlayerGroup.call(tipFrame);

    // Show panel if clicked on video
    videoPlayerGroup.on("click", function () {
      videoPanel.classed("display", !videoPanel.classed("display"));
    });

    // Swarm plot
    // Specify the y domain
    ySwarmPlot.domain(data.map(d => d.name));
    
    // Axe horizontal
    swarmPlotGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + swarmPlotHeight + ")")
      .call(xAxisSwarmPlot)

    swarmPlotGroup.append("text")
      .attr("transform", "translate(" + swarmPlotWidth + "," + (swarmPlotHeight + 25) + ")")
      .attr("y", 8)
      .attr("dy", ".7em")
      .style("text-anchor", "end")
      .text("Score");

    // Axe vertical
    swarmPlotGroup.append("g")
      .attr("class", "y axis")
      .call(yAxisSwarmPlot)
      .selectAll(".tick line")
      .attr("x2", swarmPlotWidth)
      .attr("stroke-dasharray", "4, 4");

    swarmPlotGroup.selectAll(".y.axis text")	
      .style("text-anchor", "middle")
      .attr("dx", "0.8em")
      .attr("dy", "-1em")
      .attr("transform", "rotate(-90)");
    
    var scoresFiles = d3.merge(data.map(d => d.videos.map(v => { return {dataset: d, video: v, path: "./data/" + d.name + "/" + currentMethod.name + "/" + currentClassifier.name + "/scores/" + v.name + "/" + "region_scores.json"}; })));

    // Load all scores
    Promise.all(scoresFiles.map(f => d3.json(f.path))).then(function (results) {
      var globalData = d3.merge(results.map((scores, i) => scores.map(s => {
        return {dataset: scoresFiles[i].dataset, video: scoresFiles[i].video, frame_number: s.frame_number, frame_score: s.frame_score, frame_gt: s.frame_gt, error: Math.abs(s.frame_score - s.frame_gt)};
      })));

      // take top 200 scores with biggest errors
      var numberOfNodes = 200;
      globalData = globalData.sort((x, y) => d3.descending(x.error, y.error)).slice(0, numberOfNodes);

      // Specify the r domain
      rSwarmPlot.domain([d3.min(globalData.map(d => d.error)), d3.max(globalData.map(d => d.error))]);

      // Map the basic node data to d3-friendly format.
      var nodes = globalData.map(function(node) {
        return {
          fillColor: colorScore(node.frame_score),
          strokeColor: node.frame_gt == 1 ? 'red' : 'blue',
          x: xSwarmPlot(node.frame_score),
          y: ySwarmPlot(node.dataset.name) + 66,
          radius: rSwarmPlot(node.error)
        };
      });

      //Defining the force simulation
      var simulation = d3.forceSimulation(nodes)
        .force('x', d3.forceX(d => d.x).strength(4))
        .force('y', d3.forceY(d => d.y))
        .force('collide', d3.forceCollide(d => d.radius + 1))
        .stop();
      
      for (var i = 0; i < 120; ++i) simulation.tick();

      //Draw bubbles
      swarmPlotGroup.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.radius)
        .attr("fill", d => d.fillColor)
        .attr("stroke", d => d.strokeColor);
    });
  });

  // Add options for error types
  d3.select("#error-type")
    .on("change", function () {
      currentErrorType = errorTypes[+d3.select(this).property("value")];
      // Update the swarm plot
    })
    .selectAll("option")
    .data(errorTypes)
    .enter()
    .append("option")
    .attr("value", (d, i) => i)
    .text(d => d.name);
    
  /**
   * Add options to the CSS selectors.
   */
  function addOptions() {
    // Add videos
    d3.select("#video-select")
      .on("change", function () {
        currentVideo = currentData.videos[+d3.select(this).property("value")];
        // Reset the video
        resetOperation();
      })
      .selectAll("option")
      .data(currentData.videos)
      .enter()
      .append("option")
      .attr("value", (d, i) => i)
      .text(d => d.name);
  
    // Add methods
    d3.select("#method-select")
      .on("change", function () {
        currentMethod = currentData.models[+d3.select(this).property("value")];
        currentClassifier = currentMethod.classifiers[0];
        // Clear previous options
        d3.select("#classifier-select").selectAll("option").remove();
        // Add classifiers
        addClassifierOptions();
      })
      .selectAll("option")
      .data(currentData.models)
      .enter()
      .append("option")
      .attr("value", (d, i) => i)
      .text(d => d.name);
  
    // Add classifiers
    addClassifierOptions();
  }

  /**
   * Add classifier options to the CSS selectors.
   */
  function addClassifierOptions() {
    // Add classifiers
    d3.select("#classifier-select")
      .on("change", function () {
        currentClassifier = currentMethod.classifiers[+d3.select(this).property("value")];
      })
      .selectAll("option")
      .data(currentMethod.classifiers)
      .enter()
      .append("option")
      .attr("value", (d, i) => i)
      .text(d => d.name);
  }

  /**
   * What to do when play button is pressed.
   */
  function playOperation() {
    d3.select("#play-circles-button").classed("green", true);
    d3.select("#stop-circles-button").classed("red", false);
    // Extract the video image duration
    videoFPS = d3.select("input").node().value;
    videoImageDuration = 1000 / videoFPS;
    // Deactivate input for video fps
    d3.select("input").property("disabled", true);
    // Start the video
    /***** Load data *****/
    d3.json("./data/" + currentData.name + "/" + currentMethod.name + "/" + currentClassifier.name + "/scores/" + currentVideo.name + "/" + "region_scores.json").then(function (data) {
      // Interrupt any transition
      videoPlayerGroup.selectAll("image").interrupt();
      // Clear any existing
      videoPlayerGroup.selectAll("image").remove();
      // Replace image with transition duration
      videoPlayerGroup.selectAll("image")
        .data(data.filter(d => d.frame_number >= d3.select("#frame-count").text()))
        .enter()
        .append("svg:image")
        .attr("x", videoImagePosX)
        .attr("y", videoImagePosY)
        .attr("height", videoImageHeight)
        .attr("width", videoImageWidth)
        .transition() // <------- TRANSITION STARTS HERE --------
        .delay((d, i) => videoImageDuration * i)
        .duration(videoImageDuration)
        .attr("xlink:href", d => "./data/" + currentData.name + "/frames/" + currentVideo.name + "/" + d.frame_filename)
        .on('end', updateVideoRelatedStuff);
    });
  }

  /**
   * What to do when stop button is pressed.
   * Also used in selectors.
   */
  function stopOperation() {
    videoPanel.classed("display", true);
    d3.select("#play-circles-button").classed("green", false);
    d3.select("#stop-circles-button").classed("red", true);
    // Activate input for video fps
    d3.select("input").property("disabled", false);
    // Open the region scores json file and read the frames and region images
    d3.json("./data/" + currentData.name + "/" + currentMethod.name + "/" + currentClassifier.name + "/scores/" + currentVideo.name + "/" + "region_scores.json").then(function (data) {
      // Interrupt any transition
      videoPlayerGroup.selectAll("image").interrupt();
      // Clear any existing
      videoPlayerGroup.selectAll("image").remove();
      // Put image
      videoPlayerGroup.selectAll("image")
        .data(data.filter(d => d.frame_number == d3.select("#frame-count").text()))
        .enter()
        .append("svg:image")
        .attr("x", videoImagePosX)
        .attr("y", videoImagePosY)
        .attr("height", videoImageHeight)
        .attr("width", videoImageWidth)
        .attr("xlink:href", d => "./data/" + currentData.name + "/frames/" + currentVideo.name + "/" + d.frame_filename)
        .each(updateVideoRelatedStuff);
    });
  }

  /**
   * What to do when reset button is pressed.
   * Also used in selectors.
   */
  function resetOperation() {
    videoPanel.classed("display", false);
    d3.select("#play-circles-button").classed("green", false);
    d3.select("#stop-circles-button").classed("red", true);
    // Activate input for video fps
    d3.select("input").property("disabled", false);
    // Pause the video and reset the frame-count to 1
    videoAlpha = currentData.resolution.width / currentData.resolution.height;
    if (videoAlpha < videoBeta) {
      var correctWidth = videoPlayerHeight * videoAlpha;
      videoImagePosX = (videoPlayerWidth - correctWidth) / 2;
      videoImagePosY = 0;
      videoImageHeight = videoPlayerHeight;
      videoImageWidth = correctWidth;
    } 
    else {
      var correctHeight = videoPlayerWidth / videoAlpha;
      videoImagePosX = 0;
      videoImagePosY = (videoPlayerHeight - correctHeight) / 2;
      videoImageHeight = correctHeight;
      videoImageWidth = videoPlayerWidth;
    }
    // Reset video scales
    videoX = d3.scaleLinear().range([videoImagePosX, videoImageWidth + videoImagePosX]);
    videoY = d3.scaleLinear().range([videoImagePosY, videoImageHeight + videoImagePosY]);
    // Reset the video domains
    videoX.domain([0, currentData.resolution.width]);
    videoY.domain([0, currentData.resolution.height]);
    // Open the region scores json file and read the frames and region images
    d3.json("./data/" + currentData.name + "/" + currentMethod.name + "/" + currentClassifier.name + "/scores/" + currentVideo.name + "/" + "region_scores.json").then(function (data) {
      // Interrupt any transition
      videoPlayerGroup.selectAll("image").interrupt();
      // Clear any existing
      videoPlayerGroup.selectAll("image").remove();
      // Put image
      videoPlayerGroup.selectAll("image").data([data[0]])
        .enter()
        .append("svg:image")
        .attr("x", videoImagePosX)
        .attr("y", videoImagePosY)
        .attr("height", videoImageHeight)
        .attr("width", videoImageWidth)
        .attr("xlink:href", d => "./data/" + currentData.name + "/frames/" + currentVideo.name + "/" + d.frame_filename)
        .each(updateVideoRelatedStuff);
    });
  }

  /**
   * What to do every time the video image is changed.
   */
  function updateVideoRelatedStuff (d) {
    // Update frame count
    d3.select("#frame-count").text(d.frame_number);
    // Once the video is finished playing, call reset operation
    if (d.frame_number === currentVideo.size) {
      resetOperation();
    }
    // Show frame-level tooltip
    videoPlayerGroup.selectAll("image")
      .on("mouseover", tipFrame.show)
      .on("mouseout", tipFrame.hide);
    // Clear any existing bounding boxes
    videoPlayerGroup.selectAll(".region").remove();
    // Put regions
    videoPlayerGroup.selectAll("rect region")
      .data(d.regions)
      .enter()
      .append("rect")
      .attr("class", "region")
      .attr("x", r => videoX(r.bounding_box.x1))
      .attr("y", r => videoY(r.bounding_box.y1))
      .attr("height", r => videoY(r.bounding_box.y2) - videoY(r.bounding_box.y1))
      .attr("width", r => videoX(r.bounding_box.x2) - videoX(r.bounding_box.x1))
      .attr("fill", r => colorScore(r.score))
      .attr("stroke", r => colorObjects(r.label))
      .on("mouseover", function (r) {
        // Show the hovered region images in the panel
        // Update images inside the panel
        updateRegionImages(r);
        // Put focus on the corresponding bar
        barChartBarsGroup.selectAll("rect")
          .classed("selected", function (i) {
            return i.region_number === r.region_number;
          })
          .classed("hide", function (i) {
            return i.region_number !== r.region_number;
          });
        // Show the tooltip
        return tip.show(r);
      })
      .on("mouseout", function (r) {
        // Show the region images with highest score in the panel
        // Extract the region with highest score
        var detectedRegion = d.regions.sort((x, y) => d3.descending(x.score, y.score))[0];
        // Update images inside the panel
        updateRegionImages(detectedRegion);
        // Reset the focus on the corresponding bar
        barChartBarsGroup.selectAll("rect")
          .classed("selected", false)
          .classed("hide", false);
        // Hide the tooltip
        return tip.hide(r);
      });
    
    if (Array.isArray(d.regions) && d.regions.length) {
      // Show the region images with highest score in the panel
      // Extract the region with highest score
      var sortedRegions = d.regions.sort((x, y) => d3.descending(x.score, y.score)).slice(0, 5); // take top 5 scores
      // Update images inside the panel
      updateRegionImages(sortedRegions[0]);

      // Update the bar chart
      yBarChart.domain(sortedRegions.map(r => "#" + r.region_number));

      // remove any existing bar chart
      barChartBarsGroup.selectAll("*").remove();

      // create bar chart and add the percentage of votes to the right of each bar
      var bars = barChartBarsGroup.selectAll(".bar")
        .data(sortedRegions)
        .enter()
        .append("g");
      // add bars
      bars.append("rect")
        .style("fill", r => colorScore(r.score))
        .attr("x", 0)
        .attr("width", r => xBarChart(r.score))
        .attr("y", r => yBarChart("#" + r.region_number))
        .attr("height", yBarChart.bandwidth())
        .on("mouseover", function (r) {
          // Show the hovered region images in the panel
          // Update images inside the panel
          updateRegionImages(r);
          // Put focus on the corresponding regions
          videoPlayerGroup.selectAll(".region")
            .classed("selected", function (i) {
              return i.region_number === r.region_number;
            })
            .classed("hide", function (i) {
              return i.region_number !== r.region_number;
            });
          // Show the tooltip
          return tip.show(r);
        })
        .on("mouseout", function (r) {
          // Show the region images with highest score in the panel
          // Update images inside the panel
          updateRegionImages(sortedRegions[0]);
          // Reset the focus on the corresponding regions
          videoPlayerGroup.selectAll(".region")
            .classed("selected", false)
            .classed("hide", false);
          // Hide the tooltip
          return tip.hide(r);
        });
      // add percentages
      bars.append("text")
        .attr("x", r => xBarChart(r.score) + 3)
        .attr("y", r => yBarChart("#" + r.region_number) + yBarChart.bandwidth() / 2 + 4)
        .text(r => r.score.toFixed(2));
      // make y axis to show region numbers
      barChartAxisGroup.call(yAxisBarChart);
    }
    else {
      // Clear any existing images
      realAppearGroup.selectAll("image").remove();
      fakeAppearGroup.selectAll("image").remove();
      realMotionGroup.selectAll("image").remove();
      fakeMotionGroup.selectAll("image").remove();

      // remove any existing bar chart
      barChartBarsGroup.selectAll("*").remove();
      barChartAxisGroup.selectAll("*").remove();
    }
  }

  /**
   * Gets the text associated with the tooltip.
   *
   * @param r               The region in the frame hovered by the mouse.
   * @return {string}       The text to display in the tooltip.
   */
  function getBBoxToolTipText(r) {
    return "Region: <strong>" + r.label + " #" + r.region_number + "</strong><br>" +
      "Anomaly score: <strong>" + r.score.toFixed(3);
  }

  /**
   * Gets the text associated with the tooltip.
   *
   * @param f               The frame hovered by the mouse.
   * @return {string}       The text to display in the tooltip.
   */
  function getFrameToolTipText(f) {
    return "Frame number: <strong>" + f.frame_number + "</strong><br>" +
      "Frame-level score: <strong>" + f.frame_score.toFixed(3) + "</strong><br>" +
      "Ground-truth: <strong>" + f.frame_gt + " (" + (f.frame_gt === 1 ? "abnormal" : "normal") + ")";
  }

  /**
   * Put region images inside the panel.
   */
  function updateRegionImages(region) {
    // Clear any existing images
    realAppearGroup.selectAll("image").remove();
    fakeAppearGroup.selectAll("image").remove();
    realMotionGroup.selectAll("image").remove();
    fakeMotionGroup.selectAll("image").remove();
    // Put images
    realAppearGroup.selectAll("image").data([0])
      .enter()
      .append("svg:image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", regionImagesHeight)
      .attr("width", regionImagesWidth)
      .attr("xlink:href", "./data/" + currentData.name + "/region/" + currentVideo.name + "/" + currentData.structures[0].name + "/" + region.appear_filename);
    fakeAppearGroup.selectAll("image").data([0])
      .enter()
      .append("svg:image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", regionImagesHeight)
      .attr("width", regionImagesWidth)
      .attr("xlink:href", "./data/" + currentData.name + "/region/" + currentVideo.name + "/" + currentMethod.name + "/" + region.appear_filename);
    realMotionGroup.selectAll("image").data([0])
      .enter()
      .append("svg:image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", regionImagesHeight)
      .attr("width", regionImagesWidth)
      .attr("xlink:href", "./data/" + currentData.name + "/region/" + currentVideo.name + "/" + currentData.structures[0].name + "/" + region.motion_filename);
    fakeMotionGroup.selectAll("image").data([0])
      .enter()
      .append("svg:image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", regionImagesHeight)
      .attr("width", regionImagesWidth)
      .attr("xlink:href", "./data/" + currentData.name + "/region/" + currentVideo.name + "/" + currentMethod.name + "/" + region.motion_filename);
  }

})(d3);
