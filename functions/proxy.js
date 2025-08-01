// functions/proxy.js (โค้ดที่แก้ไขแล้ว)

// ไม่ต้อง import node-fetch แล้ว
// const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
    }

    const gasUrl = event.queryStringParameters.url;
    const body = event.body ? JSON.parse(event.body) : {};

    if (!gasUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing GAS URL parameter.' }),
      };
    }

    const gasResponse = await fetch(gasUrl, { // <<< ใช้ fetch ที่ติดมากับ Node.js เลย
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const gasData = await gasResponse.json();

    return {
      statusCode: gasResponse.status,
      body: JSON.stringify(gasData),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
