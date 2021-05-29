let AWS = require("aws-sdk");

//Create new DocumentClient
let documentClient = new AWS.DynamoDB.DocumentClient();
// method to get historic news data from database
module.exports.getTextData = async () => {
    // params for database
    let params = {
    TableName: "historic_news_papers",
    KeyConditionExpression: `newspaper_name = :Rec `,
    ExpressionAttributeValues:{
            ":Rec": "guardian"
        }
    }
    
    return documentClient.query(params).promise();
};
//method to save sentiment data to database
module.exports.saveSentimentData = async (result,timestamp) => {
    // DynamodB params
    let dbParams = {
        TableName: "sentiment_analysis",
        Item : {
            "newspaper_name": "guardian",
            "news_timestamp": timestamp,
            "sentiment": result
        }
        
    };
    
    return documentClient.put(dbParams).promise();
};