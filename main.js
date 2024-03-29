const { App, ExpressReceiver } = require("@slack/bolt");
const awsServerlessExpress = require("aws-serverless-express");
const fetcher = require("./noteCountFetcher");
const profile = require("./profile");

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

app.command('/note', async ({ command, ack, say, body}) => {
  await ack();

  let AWS = require("aws-sdk");
  let lambda = new AWS.Lambda();

  console.log(JSON.stringify(body));
  console.log(JSON.stringify(body.channel_id));

  // 起動するだけ
  const result = await lambda.invoke({
    FunctionName: "serverless-bolt-js-dev-hello",
    InvocationType: "Event",
    Payload: JSON.stringify({
      "magazineId": process.env.MAGAZINE_ID,
      "channelId": body.channel_id,
      "sortBy": "like",
      "dateStr": command.text
    })
  }).promise();

  const targetMonth = command.text || '今月'

  await say(`${targetMonth}のいいね数ランキングを取得中…`);
});

app.command('/divide', async ({ command, ack, say }) => {
  await ack();

  // TODO: ここでチャンネルのメンバーを取得する
  members = [
  ];

  console.log(members);

  const team_a = getRandomSubarray(members, 4);
  const team_b = members.filter((member) => {
    return !team_a.includes(member);
  });

  console.log(team_a);
  console.log(team_b);

  await say(`TeamA: ${team_a.join(', ')}\nTeamB: ${team_b.join(', ')}`);
});

app.event('app_mention', async ({ say, event, client }) => {
  await say("うるせーバーカ:poop:");
});

module.exports.hello = async (event) => {
  const result = await fetcher.getMonthlyCountForEachUserInMagazine(event["magazineId"], event["dateStr"]);

  for (const user of result) {
    const imageUrl = await profile.getProfileImageUrl(user.name);
    user.profileImageUrl = imageUrl;
  }

  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: event["channelId"],
    text: `こんな感じ :wave:`,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `こんな感じ :wave:`,
        }
      },
      {
        "type": "divider"
      },
      ...buildBlock(sortByKey(result, event["sortBy"]))
    ]
  });


  return {
    statusCode: 200,
    body: ""
  };
};

const sortByKey = (users, sortBy) => {
  let result;
  switch (sortBy) {
    case 'count':
      result = users.sort((a, b) => { return b.count - a.count });
      break;
    case 'like':
      result = users.sort((a, b) => { return b.like - a.like });
      break;

    default:
      result = users;
      break;
  }
  return result;
};

const buildBlock = (resultObj) => {
  block = [];
  for (user of resultObj) {
    block.push(
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*<https://note.com/${user.name}|${user.name}>*\n投稿数: ${user.count}\nいいね数: ${user.like}`,
        },
        "accessory": {
          "type": "image",
          "image_url": `${user.profileImageUrl}`,
          "alt_text": `${user.name} thumbnail`
        }
      },
      {
        "type": "divider"
      }
    );
  }
  return block;
};

const getRandomSubarray = (arr, size) => {
  let shuffled = arr.slice(0);
  let i = arr.length;
  let temp, index;

  while (i--) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
};

// Handle the Lambda function event
module.exports.handler = (event, context) => {
  console.log("⚡️ Bolt app is running!");
  awsServerlessExpress.proxy(server, event, context);
};
