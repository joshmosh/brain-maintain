## Brain Maintain

Deployable game for testing your basic math skills.

## Requirements

- Node.js with NPM
- Mongodb Database (Local or Hosted)

## Installation

- git clone https://github.com/joshmosh/brain-maintain.git
- cd brain-maintain
- npm install
- cp config.sample.json config.json
- node scripts/seed.js (if you want to seed questions into your empty db)
- node app.js

## Testing

Mocha is the chosen testing library for brain-maintain. To run tests, you need to install mocha and run the mocha command:

- npm install mocha -g
- mocha (run from root of brain-maintain)

Enjoy and have fun!