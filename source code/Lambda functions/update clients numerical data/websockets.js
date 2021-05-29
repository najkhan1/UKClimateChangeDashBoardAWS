let AWS = require("aws-sdk");

//Import functions for database
let db = require('database.js');

//creates array of promises and maps them to client id array to be sent to clients when method is called
module.exports.getSendMessagePromises = async (domainName, stage,stationName) => {
    //Get connection IDs of clients
    let clientIdArray = (await db.getConnectionIds()).Items;
    console.log("\nClient IDs:\n" + JSON.stringify(clientIdArray));

    //Create API Gateway management class.
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        endpoint: domainName + '/' + stage
    });

    //Try to send message to connected clients
    let msgPromiseArray = clientIdArray.map( async item => {
        try{
            console.log("Sending message '" + "' to: " + item.client_id);
            let numericalData = (await db.getWeatherData(stationName)).Items;
            let numericalPredictions = (await db.getWeatherPredictionData(stationName)).Items;
            let trimmedData = [];
            let trimmedPredictions = [];
            // load 50 most recent data points from weather data and predictions tables to be broadcasted to all 
            for(let i =1;i<50;i++){
                trimmedData.push(numericalData[numericalData.length -i]);
                trimmedPredictions.push(numericalPredictions[numericalPredictions.length-i]);
            }
           
           // response object to be sent to client 
            let updateData = {
                update: "true",
                data: trimmedData,
                predictions: numericalPredictions
            }

            //Create parameters for API Gateway
            let apiMsg = {
                ConnectionId: item.client_id,
                Data: JSON.stringify(updateData)
            };

            //Wait for API Gateway to execute and log result
            await apigwManagementApi.postToConnection(apiMsg).promise();
            console.log("Message '" +  "' sent to: " + item.client_id);
        }
        catch(err){
            console.log("Failed to send message to: " + item.client_id);

            //Delete connection ID from database
            if(err.statusCode == 410) {
                try {
                    await db.deleteConnectionId(item.client_id);
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
        }
    });

    return msgPromiseArray;
};


