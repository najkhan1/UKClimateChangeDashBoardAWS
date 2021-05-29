//class that created weatherStation objects that can hold data for an
// observation for certain weather station
export class weatherStations {
    //Name of the station
    private _stationName: string;
    // windows active directory timestamp of the record date
    private _recordTimeStampMonth: number;
    //Maximum average temperature for the month
    private _tempMax: number;
    //Minimum average temperature for the month
    private _tempMin: number;

    constructor(stationName: string, recordTimeStampMonth: number, tempMax: number, temMin: number) {
        this._stationName = stationName;
        this._recordTimeStampMonth = recordTimeStampMonth;
        this._tempMax = tempMax;
        this._tempMin = temMin;
    }

    get stationName(): string {
        return this._stationName;
    }

    set stationName(value: string) {
        this._stationName = value;
    }

    get recordTimeStampMonth(): number {
        return this._recordTimeStampMonth;
    }

    set recordTimeStampMonth(value: number) {
        this._recordTimeStampMonth = value;
    }

    get tempMax(): number {
        return this._tempMax;
    }

    set tempMax(value: number) {
        this._tempMax = value;
    }

    get tempMin(): number {
        return this._tempMin;
    }

    set tempMin(value: number) {
        this._tempMin = value;
    }

    //method to print details of each weather station object
    printDetails():void{
        console.log(" Station: " + this._stationName + "\n Month: "+ this._recordTimeStampMonth
            +"\n Max Temp: " + this._tempMax + "\n Min Temp: "+ this._tempMin);
    }

}

