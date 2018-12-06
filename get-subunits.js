#!/usr/bin/env node

const fs = require('fs-extra')
const subunitsPath = require('./utils/subunits-path')

fs.copySync(subunitsPath, 'subunits.json')

console.log("\n\nCreated subunits.json file\n\n")
