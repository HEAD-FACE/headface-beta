// ต้องติดตั้ง node-fetch ก่อน (npm install node-fetch)
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // ดึง URL และ body จากคำขอของหน้าเว็บ
    const gasUrl = event.queryStringParameters.url;
    const body = JSON.parse(event.body);

    if (!gasUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing GAS URL parameter.' }),
      };
    }

    // ส่งคำขอ POST ไปยัง GAS Web App
    const gasResponse = await fetch(gasUrl, {
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
        // ตั้งค่า CORS headers ให้หน้าเว็บของคุณ
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
