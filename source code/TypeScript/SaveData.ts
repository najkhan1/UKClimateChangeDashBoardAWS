import {weatherStations} from './Stations';
import {TextDataObject} from "./TextDataObject";

// @ts-ignore
const AWS = require('aws-sdk');

// database object class
export class SaveData {

    private docClient;

    constructor() {
        //update aws config
        AWS.config.update({
            region:"us-east-1",
            endpoint: "http://dynamodb.us-east-1.amazonaws.com"});

        this.docClient = new AWS.DynamoDB.DocumentClient();
    }


    // @ts-ignore
    //save weather station data
    async saveData(station:weatherStations) {
        // database params
        let params = {
            TableName: "weather_stations_data",
            Item: {
                "station_name": station.stationName+"",
                "record_timestamp": station.recordTimeStampMonth,
                "MaxTemp": station.tempMax,
                "MinTemp": station.tempMin
            }
        };
        // save data to database
        this.docClient.put(params,function (error, data) {
            if (error){
                console.log("error adding data" + error);
            }else {
                console.log("items added ",data);
            }
        }).promise();
    }
    //save new data to database
    async saveTextData(newsData:TextDataObject) {
        // params for database
        let params = {
            TableName: "historic_news_papers",//
            Item: {
                "newspaper_name": "guardian",
                "news_timestamp": newsData.recordTimestamp,
                "article": newsData.newsText
            }
        };
        //save data to the table
        this.docClient.put(params,function (error, data) {
            if (error){
                console.log("error adding data" + error);
            }else {
                console.log("items added ",data);
            }
        });
    }
}
