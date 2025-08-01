// functions/proxy.js (โค้ดที่แก้ไขแล้ว)
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // เพิ่มการตรวจสอบ method เพื่อจัดการคำขอที่ไม่ใช่ POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
    }

    const gasUrl = event.queryStringParameters.url;
    
    // ตรวจสอบว่า event.body มีข้อมูลก่อนที่จะพยายาม Parse
    const body = event.body ? JSON.parse(event.body) : {};

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

    // หาก Response จาก GAS ไม่ใช่ JSON ให้จัดการ Error ที่นี่
    const contentType = gasResponse.headers.get('content-type');
    let gasData;
    if (contentType && contentType.includes('application/json')) {
      gasData = await gasResponse.json();
    } else {
      // หรืออาจจะส่งข้อมูลดิบกลับไป
      gasData = {
        error: `Unexpected content type from GAS: ${contentType}`,
        rawResponse: await gasResponse.text()
      };
    }

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
