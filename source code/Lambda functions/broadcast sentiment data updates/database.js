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

//get sentiment data from data
module.exports.getSentimentData = async () => {
    let paramsws = {
    TableName: "sentiment_analysis",
    KeyConditionExpression: "newspaper_name = :Rec",
    ExpressionAttributeValues:{
            ":Rec": "guardian"
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

