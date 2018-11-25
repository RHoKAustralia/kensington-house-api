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
    let response = {
      headers: {},
      body: '',
      statusCode: 200
    };

    switch (request.httpMethod) {
      case 'GET': {

        if (request.pathParameters) {
          getSingleUser(request.pathParameters.email, response, done);
        } else {
          getAllUsers(response, done);
        }
        break;
      }

      case 'POST': {
        console.log('POST');
        let bodyJSON = JSON.parse(request.body || '{}');
        let dynamo = new AWS.DynamoDB();
        let item = {}
        addDynamoStringIfNotEmpty(item, 'email', email);
        addDynamoStringIfNotEmpty(item, 'firstname', bodyJSON['firstName']);
        addDynamoStringIfNotEmpty(item, 'lastName', bodyJSON['lastName']);
        addDynamoStringIfNotEmpty(item, 'phoneNumber', bodyJSON['phoneNumber']);
        addDynamoStringIfNotEmpty(item, 'wouldVolunteer', bodyJSON['wouldVolunteer']);
        addDynamoStringIfNotEmpty(item, 'volunteerPeriods', JSON.stringify(bodyJSON['volunteerPeriods']));
        addDynamoStringIfNotEmpty(item, 'chosenQualificationsAndClearances', (bodyJSON['chosenQualificationsAndClearances'] || []).join('|'));
        addDynamoStringIfNotEmpty(item, 'languages', (bodyJSON['languages'] || []).join('|'));
        addDynamoStringIfNotEmpty(item, 'otherLanguages', (bodyJSON['otherLanguages'] || []).join('|'));
        addDynamoStringIfNotEmpty(item, 'skills', (bodyJSON['skills'] || []).join('|'));
        addDynamoStringIfNotEmpty(item, 'otherSkills', (bodyJSON['otherSkills'] || []).join('|'));
        addDynamoStringIfNotEmpty(item, 'restrictions', (bodyJSON['restrictions'] || []).join('|'));
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

function getAllUsers(response, done) {
  console.log('GET');
  let dynamo = new AWS.DynamoDB();
  var params = {
    TableName: questionnaireTableName,
    ProjectionExpression: 'email,firstName,lastName,phoneNumber,wouldVolunteer,volunteerPeriods,chosenQualificationsAndClearances,languages,otherLanguages,skills,otherSkills,restrictions'
  };
  // Call DynamoDB to read the item from the table
  dynamo.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      throw `Dynamo Get Error (${err})`;
    }
    else {
      if (!data.Items) {
        response['statusCode'] = 404;
        response['body'] = 'No records found';
      }
      else {
        var itemArray = [];
        for (let item of data.Items) {
          console.log(item);
          itemArray.push(handleEmptyAttributes(item));
        }
        response.body = JSON.stringify(itemArray);
      }
      done(null, response);
    }
  });
}

function getSingleUser(email, response, done) {
  console.log('GET');
  let dynamo = new AWS.DynamoDB();
  var params = {
    TableName: questionnaireTableName,
    Key: { 'email': { S: email } },
    ProjectionExpression: 'email,firstName,lastName,phoneNumber,wouldVolunteer,volunteerPeriods,chosenQualificationsAndClearances,languages,otherLanguages,skills,otherSkills,restrictions'
  };
  // Call DynamoDB to read the item from the table
  dynamo.getItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      throw `Dynamo Get Error (${err})`;
    }
    else {
      if (!data.Item) {
        response['statusCode'] = 404;
        response['body'] = 'Email address not found';
      }
      else {
        console.log("Success", data.Item.email);
        response.body = JSON.stringify(handleEmptyAttributes(data.Item));
      }
      done(null, response);
    }
  });
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

function handleEmptyAttributes(item) {
  let valuesMap = {};
  addIfNotEmpty(valuesMap, 'email', item.email);
  addIfNotEmpty(valuesMap, 'firstName', item.firstName);
  addIfNotEmpty(valuesMap, 'lastName', item.lastName);
  addIfNotEmpty(valuesMap, 'phoneNumber', item.phoneNumber);
  addIfNotEmpty(valuesMap, 'wouldVolunteer', item.wouldVolunteer);
  addIfNotEmpty(valuesMap, 'volunteerPeriods', item.volunteerPeriods);
  addIfNotEmpty(valuesMap, 'chosenQualificationsAndClearances', item.chosenQualificationsAndClearances);
  addIfNotEmpty(valuesMap, 'languages', item.languages);
  addIfNotEmpty(valuesMap, 'otherLanguages', item.otherLanguages);
  addIfNotEmpty(valuesMap, 'skills', item.skills);
  addIfNotEmpty(valuesMap, 'otherSkills', item.otherSkills);
  addIfNotEmpty(valuesMap, 'restrictions', item.restrictions);

  return valuesMap;
}
