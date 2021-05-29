//class that makes text objects to be stored to database
export class TextDataObject {
    // timestamp of the record
    private _recordTimestamp: number;
    //news article text
    private _newsText: string;

    // generic constructor and getter and setter methods
    constructor(recordTimestamp: number, newsText: string) {
        this._recordTimestamp = recordTimestamp;
        this._newsText = newsText;
    }

    get recordTimestamp(): number {
        return this._recordTimestamp;
    }

    set recordTimestamp(value: number) {
        this._recordTimestamp = value;
    }

    get newsText(): string {
        return this._newsText;
    }

    set newsText(value: string) {
        this._newsText = value;
    }
}