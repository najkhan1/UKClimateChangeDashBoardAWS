//Import external library with websocket functions
let ws = require('websocket');

//Hard coded domain name and stage - use when pushing messages from server to client
let domainName = "vfvnoa39we.execute-api.us-east-1.amazonaws.com";
let stage = "dev";

exports.handler = async (event) => {
    try {
        //Get Message from event
        const msg = JSON.parse(event.body).data;
        let connId = event.requestContext.connectionId;
        //Allocate domain name and stage dynamically
        domainName = event.requestContext.domainName;
        stage = event.requestContext.stage;
        console.log("Domain: " + domainName + " stage: " + stage);

        //Get promises message to connected clients
        let sendMsgPromises = await ws.getSendMessagePromises(msg, domainName, stage,connId);

        //Execute promises
        await Promise.all(sendMsgPromises);
    }
    catch(err){
        return { statusCode: 500, body: "Error: " + JSON.stringify(err) };
    }

    //Success
    return { statusCode: 200, body: "Data sent successfully." };
};
