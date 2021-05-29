let AWS = require("aws-sdk");

//Create new DocumentClient
let documentClient = new AWS.DynamoDB.DocumentClient();

// save synthetic predictions to database
module.exports.saveSyntheticPredictions = async (prediction) => {
    let paramsws = {
    TableName: "synthetic_data",
    Item: {
        "type_of_data": "prediction",
        "point_one_quantile": prediction.oneQuantile,
        "point_nine_quantile": prediction.nineQuantile,
        "mean": prediction.mean
    }
    }
    return documentClient.put(paramsws).promise();
};
