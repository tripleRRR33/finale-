const AWS = require('aws-sdk');
const Busboy = require('busboy');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const busboy = new Busboy({ headers: event.headers });
  const result = await new Promise((resolve, reject) => {
    const files = [];
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
        Body: file,
        ContentType: mimetype,
      };
      s3.upload(uploadParams, (err, data) => {
        if (err) {
          reject(err);
        } else {
          files.push(data.Location);
        }
      });
    });
    busboy.on('finish', () => {
      resolve(files);
    });
    busboy.end(Buffer.from(event.body, 'base64'));
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ files: result }),
  };
};
