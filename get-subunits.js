#!/usr/bin/env node

const appRoot = require('app-root-path')
const jsonPath = appRoot + '/subunits.json'


const copyFileSync = require('fs-copy-file-sync')
copyFileSync(appRoot+'/subunits.json', 'subunits.json')

console.log("\n\nCreated subunits.json file\n\n")
