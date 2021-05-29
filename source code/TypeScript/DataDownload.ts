import axios from 'axios';
import {weatherStations} from "./Stations";
import {SaveData} from "./SaveData";

//windows active directory timestamp start date
const startDate = new Date("01/01/1600");
//list of station names for which data will be saved
const stationName: string[] = ["heathrow","southampton","yeovilton","manston","eastbourne","oxford"];
//data base object that saves data to database
const saveDataToDB:SaveData = new SaveData();
// function to delay save operation
// @ts-ignore
const delaySave = ms => new Promise(resolve => setTimeout(resolve, ms));

// @ts-ignore
// processes data from the API and saves it to database
async function processData(weatherDataPromise:Promise){

    //data promise passed through method parameter
    let dataPromise: any = await weatherDataPromise;

    //text data from the api response
    let dataFile:string = dataPromise.data;

    //splitting data by each line
    let lines: string[] = dataFile.split("\n");

    //Splitting by one or more commas or white spaces and trimming the split data
    let stationName: string = lines[0].trim().split(/[ ,]+/)[0];

    //processing each line
    for(let line of lines){

        // validating that the line only contains digits
        if(line.trim().match(/^\d/)){

            //Splitting by one or more commas or white spaces and trimming the split data
            let dataLine : string[] = line.trim().split(/[ ,]+/);

            //converting date of the record to unix timestamp
            let recordDate = new Date(dataLine[1]+"/01/"+dataLine[0]);

            //subtracting record data from windows active directory timestamp which start from 01-01-1600,
            //converting current record time stamp to windows active directory timestamp
            let difference = recordDate.getTime()-startDate.getTime();
            
            if(difference != 0) {
                
                // creating weatherStations object and assigning it data 
                let station: weatherStations = new weatherStations(stationName, difference, parseFloat(dataLine[2]), parseFloat(dataLine[3]));

                //delay saving
                await delaySave(10);

                //passing the weatherStations object to database object which saves it to database
                await saveDataToDB.saveData(station);
            }
        }
    }
}

//Gathers data from API processes and saves it to database
// @ts-ignore
async function readData() {
    // Gather data for each station
    for (let station of stationName){
        //Creates promise for each API call
        // @ts-ignore
        let dataPromise = new Promise((resolve, reject) => {
            //API call with required parameter
            let data = axios.get("https://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/"+station+"data.txt");
            // return the required data if successful
            resolve(data);
            // else print message
            reject("Data not acquired");

        });
        // process the promise
        await processData(dataPromise);
    }
}

// calling the function to execute and download weather data data
readData();




