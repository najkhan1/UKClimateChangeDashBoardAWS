const AWS = require("aws-sdk");

const fs  = require("fs");

AWS.config.update({
    region:"us-east-1",
    endpoint: "http://dynamodb.us-east-1.amazonaws.com"});

let docClient = new AWS.DynamoDB.DocumentClient();

//start date of windows active directory timestamp(epoch)
let epoch = new Date("01/01/1600");
// name of all weather stations in the database
let categories = ["Heathrow","Southampton","Yeovilton","Manston","Eastbourne","Oxford"];
// arrays for test min and max temperature
let testDataMinTemp = [];
let testDataMaxTemp = [];
// arrays for train min and max temperature
let trainDataMinTemp = [];
let trainDataMaxTemp = [];
// array of timestamps
let testTimeStamp = [];
// loop through each category in categories get, format and save the data to
// appropriate files for training and testing deepAR model
async function processData() {

    for (let item =0; item< categories.length;item++){
        //re-initialising arrays for every iteration
        testDataMinTemp = [];
        testDataMaxTemp = [];
        trainDataMinTemp = [];
        trainDataMaxTemp = [];
        testTimeStamp = [];
        //params object of querying dynamodb
        let params = {
            TableName: "weather_stations_data",
            //IndexName: "RegionName",
            KeyConditionExpression: "station_name = :Rec",
            ExpressionAttributeValues:{
                ":Rec": categories[item]
            }
        }
        //format and save data to files
        await formatData(params,item);
    }


}
// function to get data from database and format into JSONLines for DeepAR algorithm
async function formatData(parameters,index) {
    // get weather monthly min and max temperature data from database
    var dataFromDB = (await docClient.query(parameters).promise()).Items;
    //convert time to unix time stamp from windows active directory timestamp
    var startTime = new Date((dataFromDB[0].record_timestamp+epoch.getTime()));
    //format test start time to DeepAR required format
    startTime = formatDate(startTime);
    // divide roughly 30% of data to be used for testing
    let dataChunk = parseInt(dataFromDB.length*0.3);
    //loop to slice the data and format it to correct form for DeepAR algorithm
    for(let item = 0;item<dataFromDB.length;item++){
        if (item<dataFromDB.length-dataChunk){
            trainDataMinTemp[item] = dataFromDB[item].MinTemp;
            trainDataMaxTemp[item] = dataFromDB[item].MaxTemp;
        }else{
            testTimeStamp.push(dataFromDB[item].record_timestamp);
            testDataMinTemp.push(dataFromDB[item].MinTemp);
            testDataMaxTemp.push(dataFromDB[item].MaxTemp);
        }
    }
    //convert time to unix time stamp from windows active directory timestamp
    let testStart = new Date((testTimeStamp[0]+epoch.getTime()));
    //format test start time to DeepAR required format
    testStart = formatDate(testStart);
    // write data to file
    await writeToFile(index,startTime,true,testStart);
    await writeToFile(index,startTime,false,testStart);

}
// function to write data to appropriate files
async function writeToFile(category,startTime,train,testStart) {
    if(train) {
        // train Object for Min temperature for DeepAR
        let trainMinOb = {
            "start": startTime,
            "cat": category,
            "target": trainDataMinTemp
        };
        //train object for Max temperature for DeepAR
        let trainMaxOb = {
            "start": startTime,
            "cat": category,
            "target": trainDataMaxTemp
        };
        //write data to appropriate files
        await appendToFile('NumericalDataTrain.json',trainMinOb)
        await appendToFile('numericalDataTrainMax.json',trainMaxOb);
    }else{
        // test Object for Min temperature for DeepAR
        let testMinOb = {
            "start": testStart,
            "cat": category,
            "target": testDataMinTemp
        };
        //test object for Max temperature for DeepAR
        let testMaxOb = {
            "start": testStart,
            "cat": category,
            "target": testDataMaxTemp
        };
        //write data to appropriate files
        await appendToFile('numericalDataTest.json',testMinOb);
        await appendToFile('numericalDataTestMax.json',testMaxOb);

    }
}

//function to append data to file
async function appendToFile(path,dataToBeSaved) {
    fs.appendFile(
        path,
        JSON.stringify(dataToBeSaved)+"\n",
        function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
}

// method to format the date into right form for DeepAR algoritm
function formatDate(dateTimestamp) {
    let formattedDate = new Date(dateTimestamp);
    let dateFromTimeStamp = formattedDate.toISOString().split("T");
    let timeFromTimeStamp = dateFromTimeStamp[1].split(".");
    return(dateFromTimeStamp[0]+" "+timeFromTimeStamp[0]);
}
// function to get data from database and format into JSONLines for DeepAR algorithm
// and then write that data to appropriate files
processData();