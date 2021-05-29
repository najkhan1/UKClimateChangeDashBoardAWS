import axios from 'axios';
import {SaveData} from "./SaveData";
import {TextDataObject} from "./TextDataObject";
// @ts-ignore
const cheerio = require('cheerio');

// Guardian api key
const apiKey:string = "5c8c4e23-f66e-4a28-b9e3-016dd3d24216";
// data access object
const saveData:SaveData = new SaveData();
// windows active directory start date
const startDate:Date = new Date("01/01/1600");
// @ts-ignore
//method to create delay
const crawlDelay = ms => new Promise(resolve => setTimeout(resolve, ms));
// varaible to count missing data
let missedData : number = 0;

// @ts-ignore
// method to get data from api
async function getTextData() {
    let yearsForData: string[] = ["2021","2015","2010","2005","1999"];
    let dataPromises: Promise<any>[] = [];

    for(let year = 2007;year>1999; year--){
        // @ts-ignore
        let getData:any = await new Promise((resolve, reject) => {
                resolve(axios.get("https://content.guardianapis.com/search?q=" +
                    "\"climate%20change\"&page-size=30&from-date="+(year-1)+"-01-01&" +
                    "to-date="+year+"-01-01&api-key="+apiKey));
                reject("No data acquired");
            });
        //let returnPromise:any = await getData;
        //await dataAcquire(getData);
        dataPromises.push(getData);
    }
    for await(let promise of dataPromises){
        await dataAcquire(promise);
    }



}
// this function process API data, scrapes,  parses and stores it to database.
// it takes promise of data from api as parameter
// @ts-ignore
async function dataAcquire(APIData:Promise<any>) {

    let data:any = await APIData;
    
    // get the data from the API response
    let results:any[] = data.data.response.results;
    
    //process the data returned from API and store it
    for (let result of results){
        //scrape the data of each page provided by API
        let scrapedData:any = await scrape(result.webUrl);
        await crawlDelay(1000);
        //if the text body scrapped it not null then save it to database
        if (await scrapedData != null || await scrapedData != "") {
            let dateTimeStamp: number = new Date(result.webPublicationDate).getTime() - startDate.getTime();
            // assign data to TextDataObject
            let textDataObject:TextDataObject = new TextDataObject(dateTimeStamp, scrapedData);
            //save data to Database
            await saveData.saveTextData(textDataObject);

        }else{
            missedData++;
        }
    }
}

//scrape data uses url of the web page to be scrapped as parameter
async function scrape(url:string) {
    //delay crawling
    await crawlDelay(1000);
    // @ts-ignore
    //promise to get data using axios
    let scrapedData = new Promise((resolve, reject) => {
        try {
            let data: any = axios.get(url);
            resolve(data);
        }catch (error) {
            console.log("an error occured error = "+ error);
            reject(null);
        }


    });

    // promise to receive scrapped data
    let data:any = await scrapedData;

    //get html data from scrapped data
    let html:string = await data.data;

    // @ts-ignore
    //load html data in cheerio
    let loadDataInCheerio = new Promise((resolve, reject) => {
        let scraper:any = cheerio.load(html)
        resolve(scraper);
        reject("error");
    });

    //'$' cheerio library caveat to query html data
    let $:any = await loadDataInCheerio;

    // @ts-ignore
    //get the article body using jquery and css tags
    let textBody = $(".article-body-commercial-selector").text();

    return textBody;
}


// @ts-ignore
// run the file process and save data to database
getTextData();

