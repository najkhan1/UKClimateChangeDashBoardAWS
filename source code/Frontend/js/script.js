
let sites = ["Heathrow","Southampton","Yeovilton","Manston","Eastbourne","Oxford"]
//web socket connection address
let connection = new WebSocket("wss://fua3ogn8cc.execute-api.us-east-1.amazonaws.com/dev");
// Name of the weather Station client is currently viewing
let siteName = "";
//sentiment classification Categories
let textCategories = [ "NEUTRAL","MIXED","POSITIVE","NEGATIVE"];
// heat map z-axis values for minimum monthly temperature
let heatMapMinTemp = [];
// heat map z-axis values for maximum monthly temperature
let heatMapMaxTemp = [];
// heat map z-axis values for predictions of minimum temperature
let predictionsMinTemp = [];
// heat map y-axis values for predictions years of prediction
let yearPredictionsMinTemp = [];
// heat map z-axis values for predictions of maximum temperature
let predictionsMaxTemp = [];

// layout for heatmap maximum temperature
let layoutMax = null;
// layout for heatmap minimum temperature
let layoutMin = null;
// heatmap data for maximum monthly temperature
let dataMax = null;
// heatmap data for monthly minimum temperature
let dataMin = null;
// heatmap monthly minimum prediction data
let dataMinPredictions = null;
// heatmap monthly maximum temperature predictions
let dataMaxPredictions = null;

// heat map y-axis values for actual data
let years = [];
// month list to be used as x-axis for heatmaps
let monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
// epoch date from where timestamp starts windows active directory timestamp
let epochDate = new Date("01/01/1600");
// values of each sentiment
let sentimentData = [0,0,0,0];

//array that holds data temporarily received from server
let allData = [];
//Open connection with server
connection.onopen = function(event){
    console.log("Connected: " + JSON.stringify(event));
    // send message to server requesting for Oxford data which will be displayed
    // on the landing page
    getDataFromServer("Oxford");
    // request sentiment data from server
    getDataFromServer("sentiment");

};


// processes message recieved from server
connection.onmessage = function(massageFromServer){
    // temperay varible to store data from message
    allData = JSON.parse(massageFromServer.data)
    // if data keys contains textData then process and plot
    // sentiment and synthetic data and predictions
    if (("textData" in allData)) {
        //process and plot
        // sentiment data
        processSentimentData(allData.textData);
        plotSentimentData(sentimentData);

        if("synthData" in allData){
            //process and plot
            //synthetic data and predictions
            plotSyntheticData(allData.synthData);
        }
    }else {
        // if data keys does not contain update then load message data
        // normall
        if (!("update" in allData)) {
            processData(allData, false);
        }else {
            // if message data contains update then update the plots
            processData(allData, true);
        }
    }
    console.log("Message received.");
}

//Log errors
connection.onerror = function (error) {
    console.log("WebSocket Error: " + JSON.stringify(error));
}

// process numerical data and predictions
async function processData(processData,updateData){
    // data to be processed
    let dataToBeProcessed = await processData;
    // if update is false load the data for heatmap min and max temperature
    if(!updateData) {
        // re-initialize arrays
        heatMapMinTemp = [];
        heatMapMaxTemp = [];
        years = [];
        // heat map z-axis values for predictions of minimum temperature
        predictionsMinTemp = [];
        // heat map y-axis values for minimum temperature predictions
        yearPredictionsMinTemp = [];
        // heat map z-axis values for predictions of maximum temperature
        predictionsMaxTemp = [];
        if("predictions" in dataToBeProcessed) {
            //convert data to heatmap format
            await updatePlotPrediction(dataToBeProcessed.predictions);
        }
        //plot heatmaps
        if("data" in dataToBeProcessed) {
            plotData(await updatePlot(dataToBeProcessed.data), "heatmap", "RdBu", "null");
        }
    }
    // if update is ture and client is viewing the weather station update is
    // for then update the plot
    if (updateData && siteName === dataToBeProcessed.data[0].station_name) {

        if("predictions" in dataToBeProcessed){
            //convert prediction to heatmap format and update plot
            await updatePlotPrediction(dataToBeProcessed.predictions);
        }

        //update heatmaps plots
        if("data" in dataToBeProcessed){
            plotData(await updatePlot(dataToBeProcessed.data),"heatmap","RdBu","null");
        }

    }
    // update name of the weather station client is currently viewing
    if("data" in dataToBeProcessed){
        siteName = dataToBeProcessed.data[0].station_name;
    }

}

async function updatePlot(processData) {
    // min and max data for each month of a year
    let monthsInYearMin = [];
    let monthsInYearMax = [];
    // fill both month arrays with null values to avoid errors
    for(let i = 0;i< 12;i++){
        monthsInYearMin.push(null);
        monthsInYearMax.push(null);

    }
    //get year from the record timestamp
    let year = new Date((processData[0].record_timestamp+epochDate.getTime())).getFullYear();
    //process each element in the data received from server
    for await(let eli of processData){
        // get year from the record timestamp
        let elYear = new Date((eli.record_timestamp+epochDate.getTime())).getFullYear();
        // if the year in the record timestamp is same keep adding min and max
        // temperature reading to respective arrays
        if(elYear === year){
            // get month from record timestamp
            let month = new Date((eli.record_timestamp+epochDate.getTime())).getMonth();
            // add min and max temp data to respective array
            monthsInYearMax[month] = eli.MaxTemp;
            monthsInYearMin[month] = eli.MinTemp;
        }else{
            // handles update check to see if the same year is not already in the years array
            if(!years.includes(year)) {
                // in case the year is different then save it to years list
                years.push(year);
                // update the saved year
                year = elYear;
                // update array containing 12 months of data to heatMapMaxTemp array
                heatMapMaxTemp.push(monthsInYearMax);
                // update array containing 12 months of data to heatMapMinTemp array
                heatMapMinTemp.push(monthsInYearMin);
                // re-initialise monthly data arrays
                monthsInYearMin = [];
                monthsInYearMax = [];
                // fill each array with null values to avoid error
                for (let i = 0; i < 12; i++) {
                    monthsInYearMin.push(null);
                    monthsInYearMax.push(null);
                }
                // get month from record timestamp
                let month = new Date((eli.record_timestamp + epochDate.getTime())).getMonth();
                // add min and max temp data to respective array
                monthsInYearMax[month] = eli.MaxTemp;
                monthsInYearMin[month] = eli.MinTemp;
            }
        }
    }
    // return name of weather stations data is from
    return processData[0].station_name;
}

// process predictions data received
async function updatePlotPrediction(processData) {

    // min and max data for each month of a year
    let monthsInYearMin = [];
    let monthsInYearMax = [];
    // fill each array with null values to avoid error
    for(let i = 0;i< 12;i++){
        monthsInYearMin.push(null);
        monthsInYearMax.push(null);
    }
    //get year from the record timestamp
    let year = new Date((processData[0].record_timestamp+epochDate.getTime())).getFullYear();
    //process each element in the data received from server
    for await(let eli of processData){
        // get year from record timestamp
        let elYear = new Date((eli.record_timestamp+epochDate.getTime())).getFullYear();
        if(elYear === year){
            // get month from record timestamp
            let month = new Date((eli.record_timestamp+epochDate.getTime())).getMonth();
            // add min and max temp data to respective arrays
            monthsInYearMax[month] = eli.MaxTemp;
            monthsInYearMin[month] = eli.MinTemp;
        }else{
            // in case the year is different then save it to years list
            yearPredictionsMinTemp.push(year);
            year = elYear;
            // update array containing 12 months of prediction data to
            // heatMapMaxTemp array
            predictionsMaxTemp.push(monthsInYearMax);
            // update array containing 12 months of prediction data to
            // heatMapMinTemp array
            predictionsMinTemp.push(monthsInYearMin);
            // re-initialise arrays
            monthsInYearMin = [];
            monthsInYearMax = [];
            // fill each array with null values to avoid error
            for(let i = 0;i< 12;i++){
                monthsInYearMin.push(null);
                monthsInYearMax.push(null);
            }
            // get month from record timestamp
            let month = new Date((eli.record_timestamp+epochDate.getTime())).getMonth();
            monthsInYearMax[month] = eli.MaxTemp;
            monthsInYearMin[month] = eli.MinTemp;
        }
    }
    // return name of weather stations data is from
    return processData[0].station_name;
}

function plotData(siteName,mapType,colourOfScale,smoothness) {
    // heatmap data for maximum monthly temperature
    dataMax = {
        z: heatMapMaxTemp,
        x: monthList,
        zsmooth:smoothness,
        y: years,
        type: mapType,
        colorscale: 'RdBu',
        colorbar:{
            len: 0.69,
            yanchor: "bottom",
            y: 0
        },
        hoverongaps: false,
        colorscale: 'RdBu'
    };
    // heatmap data for monthly minimum temperature
    dataMin = {
        z: heatMapMinTemp,
        x: monthList,
        y: years,
        zsmooth:smoothness,
        type: mapType,
        colorscale: 'RdBu',
        colorbar: {
            len: 0.69,
            yanchor: "bottom",
            y: 0
        },
        hoverongaps: false
    };
    // heatmap monthly minimum prediction data
    dataMinPredictions = {
        z: predictionsMinTemp,
        x: monthList,
        y: yearPredictionsMinTemp,
        zsmooth:smoothness,
        xaxis: 'x2',
        yaxis: 'y2',
        colorscale: colourOfScale,
        colorbar:{
            len: 0.2,
            yanchor: "top",
            y: 1,
            title: "predictions"
        },
        type: mapType,
        hoverongaps: false
    };
    // heatmap monthly maximum temperature predictions
    dataMaxPredictions = {
        z: predictionsMaxTemp,
        x: monthList,
        y: yearPredictionsMinTemp,
        zsmooth:smoothness,
        xaxis: 'x2',
        yaxis: 'y2',
        colorscale: colourOfScale,
        colorbar:{
            len: 0.2,
            yanchor: "top",
            y: 1,
            title: "predictions"
        },
        type: mapType,
        hoverongaps: false
    };
    // store data in arrays to be passed to the plot
    let dataMapMin = [dataMin,dataMinPredictions];
    let dataMapMax = [dataMax,dataMaxPredictions];
    // layout for heatmap maximum temperature
    layoutMax = {
        title: siteName + ' Average Maximum Monthly Temperature',
        yaxis: {
            domain: [0, 0.80],
        },
        xaxis:{
            showgrid: false
        },
        xaxis2: {
            anchor:'y2',
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        yaxis2: {
            domain: [0.80, 1],
            anchor: 'x2',
            showgrid: false,
            title: "Predictions"
        },
        paper_bgcolor: "black",
        plot_bgcolor: "black",
        font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#fff'
        }
    };
    // heatmap for minimum monthly predictions
    layoutMin = {
        title: siteName +' Average Minimum Monthly Temperature',
        yaxis: {
            domain: [0, 0.80],
            showgrid: false
        },xaxis:{
            showgrid: false
        },
        xaxis2: {
            anchor:'y2',
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        yaxis2: {
            domain: [0.80, 1],
            anchor: 'x2',
            title: "Predictions",
            showgrid: false,
            zeroline: false,
            showline: false
        },
        paper_bgcolor: "black",
        plot_bgcolor: "black",
        font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#fff'
        },


    };


    //get html elements to plot heatmap on
    var graphA = document.getElementById('plotData');
    var graphB = document.getElementById('rawData');

    // plot heatmaps
    Plotly.newPlot(graphA, dataMapMax,layoutMax);
    Plotly.newPlot(graphB, dataMapMin,layoutMin);


}
// process sentiment data
function processSentimentData(textData) {

    //loop over all sentiments in textData
    for (var element of textData){
        // get sentiment from record
        let sent = element.sentiment;
        //increment respective value of sentiment in sentiment data array
        // if the sentiment is detected
        if(sent === "NEUTRAL"){
            sentimentData[0] += 1;
        }
        if(sent === "MIXED"){
            sentimentData[1] += 1;
        }
        if(sent === "POSITIVE"){
            sentimentData[2] += 1;
        }
        if(sent === "NEGATIVE"){
            sentimentData[3] += 1;
        }
    }
}
// plot sentiment data
function plotSentimentData(dataArray) {
    let sentimentData = [{
        values: dataArray,
        labels: textCategories,
        type: 'pie'
    }];
    let layout = {
        height: 800,
        width: 800,
        paper_bgcolor: "black",
        title: "Climate change Sentiment analysis Guardian newspaper",
        font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#fff'
        }
    };
    // get element to plot the sentiment pie chart on
    let graphText = document.getElementById('plotTextData');
    //plot the sentiment data
    Plotly.newPlot(graphText,sentimentData,layout);
}
// send message to server
function getDataFromServer(message) {
    // message object
    let msgObject = {
        action: "wsMessage",
        data: message
    };
    //sent message to server
    connection.send(JSON.stringify(msgObject));
    console.log("Message sent: " + JSON.stringify(msgObject));
}

// plot synthetic data
function plotSyntheticData(predictions) {
    // x-axis values
    let  xValues = [];
    // y-axis  y1 values all the synthetic data
    let dataSynth = predictions[1].data_values;
    // predicted mean
    let mean = predictions[0].mean;
    // predicted 0.1 quantile
    let quantileTenth = predictions[0].point_one_quantile;
    // predicted 0.9 quantile
    let quantileNineth = predictions[0].point_nine_quantile;
    // train values x-axis
    var xValuesTrain = [];
    // load x-axis x1 values
    for(let i = 0; i < dataSynth.length; i++){
        //startTime.setHours(startTime.getHours()+1);
        xValues.push(i);
    }

    let synthPredictionsLength = dataSynth.length;
    // load x-axis x2 values
    for(let i = 0; i < mean.length; i++){
        xValuesTrain.push(synthPredictionsLength);
        synthPredictionsLength++
    }
    // synthetic data
    let actual = {
        x:xValues,
        y:dataSynth,
        mode: "lines",
        name: "Actual Data",
        line: {
            shape: 'spline',
            color: "#fff"
            //smoothing: 0.9
        }
    };
    // mean data
    let meanData = {
        mode: 'lines',
        x: xValuesTrain,
        y: mean,
        mode: 'lines',
        name: 'Mean',
        line: {
            color: '#66FF00',
            width: 2
        }
    };
    // 0.1 quantile prediction data
    let tenthQantile = {
        mode: 'lines',
        x: xValuesTrain,
        y: quantileTenth,
        mode: 'lines',
        name: 'quantile 0.1',
        line: {
            color: '#FF66FF',
            width: 2
        }
    };
    // 0.1 quantile prediction data
    let ninthQantile = {
        mode: 'lines',
        x: xValuesTrain,
        y: quantileNineth,
        mode: 'lines',
        name: 'quantile 0.9',
        line: {
            color: 'blue',
            width: 2
        }
    };
    // layout of the synthetic data plot
    let layoutOne = {
        xaxis:{
            range:[0,600],
            gridcolor: "rgba(255,0,0,0.25)",
            gridwidth: 15
        },
        yaxis: {
            tickcolor: "rgba(255,0,0,0.75)",
            tickwidth: 15,

            gridcolor: "rgba(255,0,0,0.25)",
            gridwidth: 15,

            zerolinecolor: "green",
            zerolinewidth: 2,
        },
        title: "Synthetic data and predictions",
        paper_bgcolor: "black",
        plot_bgcolor:"black",
        font: {
            family: 'Courier New, monospace',
            size: 22,
            color: '#fff'
        },
        hovermode:"true",
        legend: {
            x: 0.1,
            y: 1,
            traceorder: 'normal',
            font: {
                family: 'sans-serif',
                size: 12,
                color: '#000'
            },
            bgcolor: '#ffe6e6',
            // bordercolor: '#FFFFFF',
            // borderwidth: 2
        }
    };
    //load data to be pass to the plot
    let data = [actual,meanData,ninthQantile,tenthQantile];
    // get html element to create the plot on
    let graphText = document.getElementById('syntheticData');
    //plot data
    Plotly.newPlot(graphText,data,layoutOne);
}

// display heatmap of the data
async function showHeatmap(){
    await plotData(siteName,"heatmap","RdBu","null");
}
// display 3D surface graph of the data
async function showSurface(){
    await plotData(siteName,"surface",'Viridis',"null");
}
// apply smoothness algorithm to data in heatmap
async function applySmoothness(){
    await plotData(siteName,"heatmap","RdBu","fast");
}