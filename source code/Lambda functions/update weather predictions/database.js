let AWS = require("aws-sdk");

//Create new DocumentClient
let documentClient = new AWS.DynamoDB.DocumentClient();

// method to get weather data from database
module.exports.getWeatherData = async (stationName) => {
    // database params
    let paramsws = {
    TableName: "weather_stations_data",
    KeyConditionExpression: "station_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": stationName
        }

    }
    return documentClient.query(paramsws).promise();
};

// method to save weather predictions to weather predictions database
module.exports.saveWeatherPredictions = async (weatherPrediction) => {
    // database params
    let paramsws = {
    TableName: "weather_predictions",
    Item: {
        "station_name": weatherPrediction.stationName,
        "record_timestamp": weatherPrediction.timestamp,
        "MinTemp": weatherPrediction.minTemp,
        "MaxTemp": weatherPrediction.maxTemp
    }
    }
    
    return documentClient.put(paramsws).promise();
};
