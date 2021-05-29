let AWS = require("aws-sdk");

//Import functions for database
let db = require('database.js');

//mehot to broadcast text data update
module.exports.getSendMessagePromises = async (domainName, stage) => {
    //Get connection IDs of clients
    let clientIdArray = (await db.getConnectionIds()).Items;
    

    //Create API Gateway management class.
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        endpoint: domainName + '/' + stage
    });

    //Try to send message to connected clients
    let msgPromiseArray = clientIdArray.map( async item => {
        try{
            console.log("Sending message '" + "' to: " + item.client_id);
            // get sentiment data from database
            let alllData = (await db.getSentimentData()).Items;
            
            //creat response object
            let updateData = {
                // get lastest 100 data points from sentiment analysis table
                textData: trimData(alllData)
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

// trim the data recieve from db to latest 100 data points
function trimData(dataArray){
    var tempArray = [];
        for(var i =101;i<dataArray.length;i++){
             tempArray.push(dataArray[dataArray.length -i]);
        }
        return tempArray; 
        
}