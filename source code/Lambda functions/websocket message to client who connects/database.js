let AWS = require("aws-sdk");

//Create new DocumentClient
let documentClient = new AWS.DynamoDB.DocumentClient();

//Returns all of the connection IDs
module.exports.getConnectionIds = async () => {
    // database params
    let params = {
        TableName: "websockets_clients"
    };
    return documentClient.scan(params).promise();
};

// method to get weather data by station name
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

// method to get predictions data by station name
module.exports.getPredictionData = async (stationName) => {
    // database params
    let paramsws = {
    TableName: "weather_predictions",
    KeyConditionExpression: "station_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": stationName
        }
    }
    
    return documentClient.query(paramsws).promise();
};

// gets all sentiment data
module.exports.getSentimentData = async () => {
    // database params
    let paramsws = {
    TableName: "sentiment_analysis",
    KeyConditionExpression: "newspaper_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": "guardian"
        }
    }
    
    return documentClient.query(paramsws).promise();
};

// gets synthetic data and prediction
module.exports.getSynthData = async () => {
    // database params
    let paramsws = {
    TableName: "synthetic_data"
    }
    
    return documentClient.scan(paramsws).promise();
};

//Deletes the specified connection ID
module.exports.deleteConnectionId = async (connectionId) => {
    // database params
    console.log("Deleting connection Id: " + connectionId);

    let params = {
        TableName: "websockets_clients",
        Key: {
            client_id : connectionId
        }
    };
    return documentClient.delete(params).promise();
};

