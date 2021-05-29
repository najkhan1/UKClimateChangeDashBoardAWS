let AWS = require("aws-sdk");

//Create new DocumentClient
let documentClient = new AWS.DynamoDB.DocumentClient();

//Returns all of the connection IDs
module.exports.getConnectionIds = async () => {
    let params = {
        TableName: "websockets_clients"
    };
    return documentClient.scan(params).promise();
};

// method to get data from weather stations table
module.exports.getWeatherData = async (stationName) => {
    let paramsws = {
    TableName: "weather_stations_data",
    KeyConditionExpression: "station_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": stationName
        }
    }
    
    return documentClient.query(paramsws).promise();
};

// get weather predictions from database
module.exports.getWeatherPredictionData = async (stationName) => {
    let paramsws = {
    TableName: "weather_predictions",
    KeyConditionExpression: "station_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": stationName
        }
    }
    
    return documentClient.query(paramsws).promise();
};

//Deletes the specified connection ID
module.exports.deleteConnectionId = async (connectionId) => {
    console.log("Deleting connection Id: " + connectionId);

    let params = {
        TableName: "websockets_clients",
        Key: {
            client_id : connectionId
        }
    };
    return documentClient.delete(params).promise();
};

