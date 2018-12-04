#!/usr/bin/env node

const appRoot = require('app-root-path')
const jsonPath = appRoot + '/subunits.json'


const fs = require('fs-extra')
fs.copySync(appRoot+'/subunits.json', 'subunits.json')

console.log("\n\nCreated subunits.json file\n\n")
