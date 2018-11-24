"use strict";

var AWS = require('aws-sdk');

// Get "Questionnaire" Dynamo table name.  Replace DEFAULT_VALUE 
// with the actual table name from your stack.
const questionnaireDBArn = process.env['QUESTIONNAIRE_DB'] || 'DEFAULT_VALUE'; 
const questionnaireDBArnArr = questionnaireDBArn.split('/');
const questionnaireTableName = questionnaireDBArnArr[questionnaireDBArnArr.length - 1];

// handleHttpRequest is the entry point for Lambda requests
exports.handleHttpRequest = function(request, context, done) {
  try {
    const email = request.pathParameters.email;
    let response = {
      headers: {},
      body: '',
      statusCode: 200
    };

    switch (request.httpMethod) {
      case 'GET': {
        console.log('GET');
        let dynamo = new AWS.DynamoDB();
        var params = {
          TableName: questionnaireTableName,
          Key: { 'email' : { S: email } },
          ProjectionExpression: 'email,firstname,surname,address,mobile,availableFrequency,dayPreferences,currentQualifications,spokenLanguages,skillsToShare,typesToExclude'
        };
        // Call DynamoDB to read the item from the table
        dynamo.getItem(params, function(err, data) {
          if (err) {
            console.log("Error", err);
            throw `Dynamo Get Error (${err})`
          } else {
            if (!data.Item) {
              response['statusCode'] = 404
              response['body'] = 'Email address not found'
            } else {
              console.log("Success", data.Item.email);
              response.body = JSON.stringify(
                handleEmptyAttributes(data));
            }
            done(null, response);
          }
        });
        break;
      }

      case 'POST': {
        console.log('POST');
        let bodyJSON = JSON.parse(request.body || '{}');
        let dynamo = new AWS.DynamoDB();
        let item = {}
        addDynamoStringIfNotEmpty(item, 'email', email);
        addDynamoStringIfNotEmpty(item, 'firstname', bodyJSON['firstname']);
        addDynamoStringIfNotEmpty(item, 'surname', bodyJSON['surname']);
        addDynamoStringIfNotEmpty(item, 'address', bodyJSON['address']);
        addDynamoStringIfNotEmpty(item, 'mobile', bodyJSON['mobile']);
        addDynamoStringIfNotEmpty(item, 'availableFrequency', bodyJSON['availableFrequency']);
        addDynamoStringIfNotEmpty(item, 'dayPreferences', bodyJSON['dayPreferences']);
        addDynamoStringIfNotEmpty(item, 'currentQualifications', bodyJSON['currentQualifications']);
        addDynamoStringIfNotEmpty(item, 'spokenLanguages', bodyJSON['spokenLanguages']);
        addDynamoStringIfNotEmpty(item, 'skillsToShare', bodyJSON['skillsToShare']);
        addDynamoStringIfNotEmpty(item, 'typesToExclude', bodyJSON['typesToExclude']);
        let params = {
          TableName: questionnaireTableName,
          Item: item
        };
        dynamo.putItem(params, function(error, data) {
          if (error) throw `Dynamo Error (${error})`;
          else done(null, response);
        })
        break;
      }
    }
  } catch (e) {
    done(e, null);
  }
}

function addDynamoStringIfNotEmpty(valuesMap, attributeKey, attributeValue) {
  if (attributeValue) {
    valuesMap[attributeKey] = { S: attributeValue };
  }
}

function addIfNotEmpty(valuesMap, attributeKey, attributeValue) {
  if (attributeValue) {
    valuesMap[attributeKey] = attributeValue;
  }
}

function handleEmptyAttributes(data) {
  let item = data.Item;
  let valuesMap = {};
  addIfNotEmpty(valuesMap, 'email', item.email);
  addIfNotEmpty(valuesMap, 'firstname', item.firstname);
  addIfNotEmpty(valuesMap, 'surname', item.surname);
  addIfNotEmpty(valuesMap, 'address', item.address);
  addIfNotEmpty(valuesMap, 'mobile', item.mobile);
  addIfNotEmpty(valuesMap, 'availableFrequency', item.availableFrequency);
  addIfNotEmpty(valuesMap, 'dayPreferences', item.dayPreferences);
  addIfNotEmpty(valuesMap, 'currentQualifications', item.currentQualifications);
  addIfNotEmpty(valuesMap, 'spokenLanguages', item.spokenLanguages);
  addIfNotEmpty(valuesMap, 'skillsToShare', item.skillsToShare);
  addIfNotEmpty(valuesMap, 'typesToExclude', item.typesToExclude);

  return valuesMap;
}
