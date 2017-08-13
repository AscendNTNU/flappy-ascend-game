var express = require('express')
var app = express()
var redis = require('redis')

var dotenv = require('dotenv')
dotenv.config()

var client = redis.createClient(process.env.PORT || 6379, process.env.HOST || '127.0.0.1')

client.on('connect', function () {
    console.log('connected')
})
