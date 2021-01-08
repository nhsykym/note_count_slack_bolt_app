const { App, ExpressReceiver } = require("@slack/bolt");
const awsServerlessExpress = require("aws-serverless-express");
const fetcher = require("./noteCountFetcher");

// Initialize your custom receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // The `processBeforeResponse` option is required for all FaaS environments.
  // It allows Bolt methods (e.g. `app.message`) to handle a Slack request
  // before the Bolt framework responds to the request (e.g. `ack()`). This is
  // important because FaaS immediately terminate handlers after the response.
  processBeforeResponse: true
});

// Initializes your app with your bot token and the AWS Lambda ready receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

// Initialize your AWSServerlessExpress server using Bolt"s ExpressReceiver
const server = awsServerlessExpress.createServer(expressReceiver.app);


// app.command("/note", async ({ command, ack, say, body }) => {
app.message("ランキングくれ", async ({ message, say, body }) => {
  // await ack();

  let AWS = require("aws-sdk");
  let lambda = new AWS.Lambda();

  // 起動するだけ
  const result = await lambda.invoke({
    FunctionName: "serverless-bolt-js-dev-hello",
    InvocationType: "Event",
    Payload: JSON.stringify({
      "magazineId": "m30aa4d96cb3c",
      "channelId": body.event.channel
    })
  }).promise();

  await say("少々お待ちを〜");
});

module.exports.hello = async (event) => {
  const result = await fetcher.getCountForEachUserInMagazine(event["magazineId"]);

  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: event["channelId"],
    text: `今こんな感じ :wave: \n ${JSON.stringify(result, null, 2)}`
  });


  return {
    statusCode: 200,
    body: ""
  };
};

// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log("⚡️ Bolt app is running!");
  awsServerlessExpress.proxy(server, event, context);
};