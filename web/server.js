const axios = require('axios');
const AWS = require('aws-sdk');
const stream = require('stream');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const s3 = new AWS.S3({
    accessKeyId: '***********',
    secretAccessKey: '************',
    region: '*******'
});

app.use(bodyParser.json());
app.use(cors()); 

app.post('/upload', async (req, res) => {
    const { url } = req.body;

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const pass = new stream.PassThrough();
        const params = {
            Bucket: '**********',
            Key: 'podcast.mp3',
            Body: pass
        };

        s3.upload(params, (err, data) => {
            if (err) {
                return res.status(500).send(err.toString());
            }
            res.send({ success: true, message: 'Upload successful', data: data });
        });

        response.data.pipe(pass);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});