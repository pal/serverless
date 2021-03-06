'use strict';

const { addPermission, removePermission } = require('./lib/permissions');
const { updateConfiguration, removeConfiguration, findUserPoolByName } = require('./lib/userPool');
const { getEnvironment, getLambdaArn, handlerWrapper } = require('../utils');

function handler(event, context) {
  if (event.RequestType === 'Create') {
    return create(event, context);
  } else if (event.RequestType === 'Update') {
    return update(event, context);
  } else if (event.RequestType === 'Delete') {
    return remove(event, context);
  }
  throw new Error(`Unhandled RequestType ${event.RequestType}`);
}

function create(event, context) {
  const { FunctionName, UserPoolName, UserPoolConfig } = event.ResourceProperties;
  const { Region, AccountId } = getEnvironment(context);

  const lambdaArn = getLambdaArn(Region, AccountId, FunctionName);

  return findUserPoolByName({ userPoolName: UserPoolName, region: Region }).then(userPool =>
    addPermission({
      functionName: FunctionName,
      userPoolName: UserPoolName,
      region: Region,
      accountId: AccountId,
      userPoolId: userPool.Id,
    }).then(() =>
      updateConfiguration({
        lambdaArn,
        userPoolName: UserPoolName,
        userPoolConfig: UserPoolConfig,
        region: Region,
      })
    )
  );
}

function update(event, context) {
  const { Region, AccountId } = getEnvironment(context);
  const { FunctionName, UserPoolName, UserPoolConfig } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Region, AccountId, FunctionName);

  return updateConfiguration({
    lambdaArn,
    userPoolName: UserPoolName,
    userPoolConfig: UserPoolConfig,
    region: Region,
  });
}

function remove(event, context) {
  const { Region, AccountId } = getEnvironment(context);
  const { FunctionName, UserPoolName } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Region, AccountId, FunctionName);

  return removePermission({
    functionName: FunctionName,
    userPoolName: UserPoolName,
    region: Region,
  }).then(() =>
    removeConfiguration({
      lambdaArn,
      userPoolName: UserPoolName,
      region: Region,
    })
  );
}

module.exports = {
  handler: handlerWrapper(handler, 'CustomResouceExistingCognitoUserPool'),
};
