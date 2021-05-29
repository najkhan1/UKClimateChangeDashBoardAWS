//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - used when pushing messages from server to client
let domainName = "fua3ogn8cc.execute-api.us-east-1.amazonaws.com";
let stage = "dev";

exports.handler = async (event) => {
    try {
        for(let record of event.Records){
            //check to see if the event was an insert event
            if(record.eventName === "INSERT"){
               
                //Allocate domain name and stage dynamically
            
                console.log("Domain: " + domainName + " stage: " + stage);
        
                //Get promises message to connected clients
                let sendMsgPromises = await ws.getSendMessagePromises(domainName, stage);
        
                //Execute promises
                await Promise.all(sendMsgPromises);
            }
        }
    }
    catch(err){
        return { statusCode: 500, body: "Error: " + err };
    }

    //Success
    return { statusCode: 200, body: "Data sent successfully." };
};
