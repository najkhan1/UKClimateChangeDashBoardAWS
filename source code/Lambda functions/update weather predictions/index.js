//Import AWS
let AWS = require("aws-sdk");
// import database module
let db = require("database.js");
//min and max temperature arrays to hold weather data to be sent to DeepAR
let targetDataMin = [];
let targetDataMax = [];
// array of weather station names to be queiried from database
const stationNames = ["Heathrow","Southampton","Yeovilton","Manston","Eastbourne","Oxford"];
// windows epoch start date
const epoch = new Date("01/01/1600");
// fuction to get data from the database and pass it to appropiate object
async function loadData(){
    for(let i = 0;i<stationNames.length;i++){
        await formatData(stationNames[i],i);
    }
    
}

// recieve data from data base and convert it to correct format for DeepAR algorithm
async function formatData(stationName,index) {
    // get data from database
    let dataFromDB = (await db.getWeatherData(stationName)).Items;
    // array to hold target values for test data
    let testDataMaxTemp = [];
    let testDataMinTemp = [];
    //let testTimeStamp = [];

    // convert date to unix timestamp
    let startTime = null;
    
    //get last 100 min and max temp readings from each weather station
    for(let item = 100;item>=0;item--){
            
            if(item === 100){
              startTime = new Date((dataFromDB[dataFromDB.length-1-item].record_timestamp+epoch.getTime()));
              //convert date to unix time stamp
              startTime = formatDate(startTime);
            }
            testDataMinTemp[item] = dataFromDB[dataFromDB.length-1-item].MinTemp;
            testDataMaxTemp[item] = dataFromDB[dataFromDB.length-1-item].MaxTemp;
    
    }
    //object to hold inference data for minimum temperature readings to be passed to DeepAR
    let trainMinOb = {
            "start": startTime,
            "cat": index,
            "target": testDataMinTemp
        };
    //object to hold inference data for maximum temperature readings to be passed to DeepAR
    let trainMaxOb = {
        "start": startTime,
        "cat": index,
        "target": testDataMaxTemp
    };
    console.log("tainign data "+ JSON.stringify(trainMaxOb));
    // load the objects to respective arrays
    targetDataMax.push(trainMaxOb);
    targetDataMin.push(trainMinOb);
}

// format date to correct format for DeepAR
function formatDate(dateTimestamp) {
    let formattedDate = new Date(dateTimestamp);
    let dateFromTimeStamp = formattedDate.toISOString().split("T");
    let timeFromTimeStamp = dateFromTimeStamp[1].split(".");
    return(dateFromTimeStamp[0]+" "+timeFromTimeStamp[0]);
}


//Name of endpoint for minimum temperature
const endpointName = "weatherMin";
// Name fo endpoint for maximum temperature
const endpointTwoName = "weatherMax";


//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

//Handler for Lambda function
exports.handler = async (event) => {
    try{
        for(let record of event.Records){
            //check to see if the event was an insert event
            if(record.eventName === "INSERT"){
                await loadData();
                
                //Data that we are going to send to endpoint minimum temperature
                let endpointData = {
                    "instances":
                        [
                            targetDataMin[0],
                            targetDataMin[1],
                            targetDataMin[2],
                            targetDataMin[3],
                            targetDataMin[4],
                            targetDataMin[5]
                        ],
                    "configuration":
                        {
                            "num_samples": 50,
                            "output_types":["mean","quantiles","samples"],
                            "quantiles":["0.1","0.9"]
                        }
                };
                
                
                
                //Data that we are going to send to endpoint maximum temperature
                let endpointDataTwo = {
                    "instances":
                        [
                            targetDataMax[0],
                            targetDataMax[1],
                            targetDataMax[2],
                            targetDataMax[3],
                            targetDataMax[4],
                            targetDataMax[5]
                        ],
                    "configuration":
                        {
                            "num_samples": 50,
                            "output_types":["mean","quantiles","samples"],
                            "quantiles":["0.1","0.9"]
                        }
                };
                let paramsMin = {
                EndpointName: endpointName,
                Body: JSON.stringify(endpointData),
                ContentType: "application/json",
                Accept: "application/json"
            };
            
            //Parameters for calling endpoint
            let paramsMax = {
                EndpointName: endpointTwoName,
                Body: JSON.stringify(endpointDataTwo),
                ContentType: "application/json",
                Accept: "application/json"
            };
                
                //Call endpoint and handle response minimum temperature
                let minPredictions = (await getPredictions(paramsMin));
                minPredictions = JSON.parse(minPredictions.body).predictions;
                
                // call endpoint and for response for maximum temperature
                let maxPredictions = (await getPredictions(paramsMax));
                maxPredictions = JSON.parse(maxPredictions.body).predictions;
                
                //loop to store the predictions data in database
                for (let index =0;index<minPredictions.length;index++){
                    // get the start timestamp for each category
                    let recTimestamp = new Date(targetDataMin[index].start);
                    recTimestamp.setMonth(recTimestamp.getMonth()+100);
                    for(let innerIndex = 0; innerIndex < minPredictions[index].mean.length;innerIndex++){
                        //get the start date for the category and add one month to it on every iteration
                        recTimestamp.setMonth(recTimestamp.getMonth()+1);
                        //object to be pass to database function for saving in database
                        let weatherStation = {
                            stationName: stationNames[index],
                            timestamp: recTimestamp.getTime()-epoch.getTime(),
                            minTemp: minPredictions[index].mean[innerIndex],
                            maxTemp: maxPredictions[index].mean[innerIndex]
                        }
                        //save object to database
                        await db.saveWeatherPredictions(weatherStation);
                        
                    }
                }
            }
        }
    }catch(err){
        console.log("ERROR: " + err);
    }
};

// method to get predictions for DeepAR algortihm
async function getPredictions(parameters){
    //Call endpoint and handle response
    
    let response = null;
    await awsRuntime.invokeEndpoint(parameters, (err, data)=>{
        
        if (err) {
            //An error occurred
            console.log(err, err.stack);

            //Return error response
            response = {
                statusCode: 500,
                body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
            };
            return response;
        }
        else{//Successful response
            //Convert response data to JSON
            let responseData = JSON.parse(Buffer.from(data.Body).toString('utf8'));
            

            //Return successful response
            response = {
                statusCode: 200,
                body: JSON.stringify(responseData),
            };
            return response;
        }
    }).promise();
    
   return await response;
}