let AWS = require('aws-sdk');
// import database module
let db = require("database.js");
// import AWS comprehend
let comprehend = new AWS.Comprehend();

exports.handler = async (event) => {
    
    try{
        for(let record of event.Records){
            //check to see if the event was an insert event
            if(record.eventName === "INSERT"){
                //parse the data from the new image
                let timestamp = record.dynamodb.NewImage.news_timestamp.N;
                let text = record.dynamodb.NewImage.article.S;
                // trim the news article to lenght comprehend maximum
                let textTrimmed = text.substring(0,4000)
                //params for sentiment analysis
                let params = {
                    LanguageCode: "en",
                    Text: textTrimmed
                };
                // get sentiment
                let result = await comprehend.detectSentiment(params).promise();
                // save the sentiment data to database
                await db.saveSentimentData(result.Sentiment,timestamp);
            }
        }
    }
    catch(err){
        console.log("ERROR: " + err);
    }
};
