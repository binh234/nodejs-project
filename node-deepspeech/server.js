const DeepSpeech = require('deepspeech');
const Fs = require('fs');
const Sox = require('sox-stream');
const MemoryStream = require('memory-stream');
const Duplex = require('stream').Duplex;
const Wav = require('node-wav');
const express = require('express');
const { nextTick } = require('process');
require("dotenv/config");

const app = express();
app.use(express.json());

let modelPath = './ai/digit-model-v4.pbmm';
let model = new DeepSpeech.Model(modelPath);
let desiredSampleRate = model.sampleRate();
let scorerPath = './ai/digit-scorer-v2.scorer';
let modelStream;
let recordedChunks = 0;
let silenceStart = null;
let recordedAudioLength = 0;
let endTimeout = null;
let silenceBuffers = [];

model.enableExternalScorer(scorerPath);

function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

function endAudioStream(callback) {
    console.log('[end]');
    let results = intermediateDecode();
    if (results) {
        if (callback) {
            callback(results);
        }
    }
}

function resetAudioStream() {
    clearTimeout(endTimeout);
    console.log('[reset]');
    intermediateDecode(); // ignore results
    recordedChunks = 0;
    silenceStart = null;
}

function processSilence(data, callback) {
    if (recordedChunks > 0) { // recording is on
        process.stdout.write('-'); // silence detected while recording

        feedAudioContent(data);

        if (silenceStart === null) {
            silenceStart = new Date().getTime();
        } else {
            let now = new Date().getTime();
            if (now - silenceStart > SILENCE_THRESHOLD) {
                silenceStart = null;
                console.log('[end]');
                let results = intermediateDecode();
                if (results) {
                    if (callback) {
                        callback(results);
                    }
                }
            }
        }
    } else {
        process.stdout.write('.'); // silence detected while not recording
        bufferSilence(data);
    }
}

function bufferSilence(data) {
    // VAD has a tendency to cut the first bit of audio data from the start of a recording
    // so keep a buffer of that first bit of audio and in addBufferedSilence() reattach it to the beginning of the recording
    silenceBuffers.push(data);
    if (silenceBuffers.length >= 3) {
        silenceBuffers.shift();
    }
}

function addBufferedSilence(data) {
    let audioBuffer;
    if (silenceBuffers.length) {
        silenceBuffers.push(data);
        let length = 0;
        silenceBuffers.forEach(function(buf) {
            length += buf.length;
        });
        audioBuffer = Buffer.concat(silenceBuffers, length);
        silenceBuffers = [];
    } else audioBuffer = data;
    return audioBuffer;
}

function processVoice(data) {
    silenceStart = null;
    if (recordedChunks === 0) {
        console.log('');
        process.stdout.write('[start]'); // recording started
    } else {
        process.stdout.write('='); // still recording
    }
    recordedChunks++;

    data = addBufferedSilence(data);
    feedAudioContent(data);
}

function createStream() {
    modelStream = model.createStream();
    recordedChunks = 0;
    recordedAudioLength = 0;
}

function finishStream() {
    if (modelStream) {
        let start = new Date();
        let text = modelStream.finishStream();
        if (text) {
            console.log('');
            console.log('Recognized Text:', text);
            let recogTime = new Date().getTime() - start.getTime();
            return {
                text,
                recogTime,
                audioLength: Math.round(recordedAudioLength)
            };
        }
    }
    silenceBuffers = [];
    modelStream = null;
}

function intermediateDecode() {
    let results = finishStream();
    createStream();
    return results;
}

function feedAudioContent(chunk) {
    recordedAudioLength += (chunk.length / 2) * (1 / 16000) * 1000;
    modelStream.feedAudioContent(chunk);
}

createStream();

app.post('/api/sdr', (req, res, next) => {
    req.setEncoding('binary');
    let chunks = [];

    req.on('data', (chunk) => {
        processVoice(Buffer.from(chunk, 'binary'));
    });

    req.on('end', () => {
        console.log('done');
        endAudioStream((results) => {
            console.log('result', results);
            res.json({
                status_code: 0,
                hypothesis: results,
                id: ''
            })
        });
    });
})

const port = process.env.PORT || 3000;
app.listen(3000, () => {
    {
        console.log(`listening on port ${port}...`);
    }
})