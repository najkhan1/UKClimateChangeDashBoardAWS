let AWS = require("aws-sdk");

//Import functions for database
let db = require('database.js');

module.exports.getSendMessagePromises = async (message, domainName, stage,connectionId) => {
    //Get connection IDs of clients
    let clientId = connectionId;

    //Create API Gateway management class.
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        endpoint: domainName + '/' + stage
    });
    //Try to send message to connected clients
        try{
            //temporary object to be sent as response
            let allData = [];
            
            //if the message is not sentiment then send weather data and predictions
            if(message !== "sentiment"){
                // get weather data for requested weather station
                let numericalData = (await db.getWeatherData(message)).Items;
                // get weather predictions from database for requested station
                let predictionData = (await db.getPredictionData(message)).Items
                //creat response object
                allData = {
                    //send last 700 records of weather
                    data : trimData(numericalData,700),
                    predictions: predictionData
                };
            
            }else if (message === "sentiment"){// if message is sentiment then send sentiment data
                //get senitment data from database
                let sentiment = (await db.getSentimentData()).Items;
                // get synthetic data from data base
                let syntheticData = (await db.getSynthData()).Items;
                //creat response object
                allData = {
                    textData : trimData(sentiment,100),
                    synthData : syntheticData
                };
            }
            

            //Create parameters for API Gateway
            let apiMassage = {
                ConnectionId: clientId,
                Data: JSON.stringify(allData)
            };
            console.log("Message '" + message +  "' sent to: " + clientId);
            //Wait for API Gateway to execute and log result
            return await apigwManagementApi.postToConnection(apiMassage).promise();
            
        }
        catch(err){
            console.log("Failed to send message to: " + clientId);

            //Delete connection ID from database
            if(err.statusCode == 410) {
                try {
                    await db.deleteConnectionId(clientId);
                }
                catch (err) {
                    console.log("ERROR deleting connectionId: " + JSON.stringify(err));
                    throw err;
                }
            }
            else{
                console.log("UNKNOWN ERROR: " + JSON.stringify(err));
                throw err;
            }
           return err;
        }

    
};

// trim the data recieve from db to desired leng
function trimData(dataArray,numberOfItems){
    var tempArray = [];
        if(dataArray.length > numberOfItems){
           for(var i =1;i<numberOfItems;i++){
             tempArray.push(dataArray[dataArray.length -i]);
        }
        return tempArray; 
        }else{
            return dataArray;
        }
}


