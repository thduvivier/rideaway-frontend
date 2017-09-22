[![Build Status](https://travis-ci.org/oSoc17/rideaway-frontend.svg?branch=master)](https://travis-ci.org/oSoc17/rideaway-frontend)
[![Dependencies](https://david-dm.org/oSoc17/rideaway-frontend.svg)](https://david-dm.org/oSoc17/rideaway-frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](https://opensource.org/licenses/MIT)

# Rideaway Frontend

## Installation

### Prerequisites
Create a `.env` file in the root directory, you can use the `.env.default` to help you create it.

Edit the webpack config and fill in the domain name.

```js
new OfflinePlugin({
    publicPath: 'https://DOMAIN_NAME_HERE',
```

### Install dependencies

```sh
$ npm install
```

### Install and run the dev version, server available at `localhost:3000`:
```sh
$ npm run dev
```

### Compile a production version in the `./build` folder:
```sh
$ npm run prod
```

## Project information

This project is an excellent demonstration of the power of OSM to support an advanced mobile app that assists in the navigation of cyclists through the Brussel’s regional cycling network.

* Give the cycle network more visibility
* Get the cycle routes more incorporated in the daily life

### Why
Why are people not using the Brussels Cycle Network?
Because they don’t know it exists.
 
We want to make the Brussels Cycling Network more practical and accessible.

### What 
We are creating a tool to explore, plan and navigate the Brussels Cycling Network.

