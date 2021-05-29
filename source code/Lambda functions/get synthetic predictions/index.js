//Import AWS
let AWS = require("aws-sdk");

let db = require("database.js")

//Data that we are going to send to endpoint
let endpointData = {
    "instances":
        [
            {
                "start":"2020-06-20 08:00:00",
                "target": [435.655001222478,426.842763577824,416.37073287474936,405.66267863722385,439.9916220673149,416.55510637464715,434.3601987654136,422.9003191866805,446.6850710799621,455.0398050608191,487.4575216905125,483.451416859505,466.3030344117047,459.61442517128677,487.44728665823993,493.0791936247165,470.6612272843175,472.89235647652964,449.44099435964876,474.000070976079,473.61518164919306,445.04536361865905,461.1517086999474,450.1078776722383,435.84220948593315,421.7913343708979,430.7523817973632,432.65583973802427,452.3075295693895,448.61939300535164,467.71233294904783,451.34619787164,460.5681145197235,497.2409163779387,498.6597654862962,506.8204781996634,497.2598199725996,484.22716259202207,500.8160954524134,489.4382401794028,481.9602947174848,471.2285720402475,484.72792323471845,498.6093380642501,499.1889568519466,452.59141812650597,443.92021424947575,435.34227939516757,456.0008865102651,442.76138228411367,453.94984023379516,449.9941176983851,478.1680956654183,457.648761028267,447.21166515545934,491.75529849034746,465.98642866579814,480.83303193057526,487.7006723434582,497.6031366379185,501.36192055266025,542.8854996129322,535.3130003531818,508.0324858670976,491.3026017767866,499.43453921322026,523.9575398445392,502.9638895168637,509.1071289950479,462.8578400864975,497.48702426156945,459.93956111007157,488.023080606305,485.16826140925184,486.4443638922888,488.1211624538368,470.2109308641719,459.8790416409959,475.1352036480482,513.4674391344658,480.74505800962925,495.5378189942091,503.46058655021596,540.8982945093113,520.2183444368484,508.25935414339284,527.177366148714,531.8908322296646,556.0112989464458,512.5467033533499,549.8126165572133,541.2377261121775,510.61781934079,507.18012171313273,479.5214266925334,490.96467238260874,467.70691440942295,467.3274864811273,470.296034312899,472.18201212203905]
            }
        ],
    "configuration":
        {
            "num_samples": 50,
            "output_types":["mean","quantiles","samples"],
            "quantiles":["0.1","0.9"]
        }
};

//Name of endpoint
const endpointName = "synthOneEndpoint";

//Parameters for calling endpoint
let params = {
    EndpointName: endpointName,
    Body: JSON.stringify(endpointData),
    ContentType: "application/json",
    Accept: "application/json"
};

//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

//Handler for Lambda function
exports.handler = async (event) => {
    
    try{
        for(let record of event.Records){
            //check to see if the event was an insert event
            if(record.eventName === "INSERT"){
    
                let dataObject = null;
                //Call endpoint and handle response
                await awsRuntime.invokeEndpoint(params, (err, data)=>{
                    if (err) {//An error occurred
                        console.log(err, err.stack);
            
                        //Return error response
                        const response = {
                            statusCode: 500,
                            body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
                        };
                        return response;
                    }
                    else{//Successful response
                        //Convert response data to JSON
                        let responseData = JSON.parse(Buffer.from(data.Body).toString('utf8'));
                        responseData = JSON.stringify(responseData);
                        //parse JSON to get the data
                        responseData = JSON.parse(responseData);
                        // put response data in responseData object
                        dataObject = {
                            oneQuantile: responseData.predictions[0].quantiles[0.1],
                            nineQuantile: responseData.predictions[0].quantiles[0.9],
                            mean: responseData.predictions[0].mean
                        }
                        
            
                        //Return successful response
                        const response = {
                            statusCode: 200,
                            body: JSON.stringify(responseData),
                        };
                        return response;
                    }
                }).promise();
                if(dataObject !== null){
                    await db.saveSyntheticPredictions(await dataObject);
                }
            }
        }
    }
    catch(err){
        console.log("ERROR: " + err);
    }
};
