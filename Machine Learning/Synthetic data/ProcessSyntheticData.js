//class to process synthetic data and save to json for
// DeepAR model training
var axios = require('axios');

async function formatData() {
    // my MDX student ID
    let studentId = "M00704831";
    // get synthetic data using my id
    let synthD = await axios.get("https://39kicq1lg9.execute-api.us-east-1.amazonaws.com/prod/"+studentId+"/");
    // wait for data
    let targetData = await synthD.data;
    //slice last 100 data points for testing
    let testData = targetData.target.splice(-100);
    // start date for test data
    let startDate = new Date(synthD.data.start);
    //add 401 hours to the training start point to get the
    // start time of test data
    startDate.setHours(startDate.getHours()+401);
    // test object
    let test = {
        "start": formatDate(startDate),
        "target": testData
    };
    // train object
    let train = {
        "start": targetData.start,
        "target": targetData.target
    }
    // write data to test file
    require('fs').writeFile(

        'test.json',

        JSON.stringify(test),

        function (err) {
            if (err) {
                console.error('Error '+ err);
            }
        }
    );

    // write data to train file
    require('fs').writeFile(

        'train.json',

        JSON.stringify(train),

        function (err) {
            if (err) {
                console.error('Error'+ err);
            }
        }
    );
}

//call the function to store data in right format
// to desired files
formatData();

//format date to right form for DeepAR algorithm
function formatDate(dateTimestamp) {
    let formattedDate = new Date(dateTimestamp);
    let dateFromTimeStamp = formattedDate.toISOString().split("T");
    let timeFromTimeStamp = dateFromTimeStamp[1].split(".");
    return(dateFromTimeStamp[0]+" "+timeFromTimeStamp[0]);
}