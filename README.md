node-axel - a node.js axel client
===========================

[![npm version](https://badge.fury.io/js/node-axel.svg)](https://badge.fury.io/js/node-axel)

This is a wrapper over axel

Install with:

    npm install node-axel

## Dependency

This require axel downloader for ubuntu install it with : 

```sh
    sudo apt install axel
```

## Usage Example

```js
import Axel from 'node-axel';
    
let axelClient = new Axel();
    
axelEvents = axelClient.download(url)

axelEvents.on('progress',function(progress){
    console.log(progress);
})

// Speed : 20KB/s Progress : 20% Size: 123 

axelEvents.on('finish',function(){
    console.log('Download Finished');
})

axelEvents.on('error',function(error){
    console.log(error);
})

```

### Options

`maxspeed` - specify maximum allowd speed in bytes per second

`connections` - no of connection to use while downloading

`output` - path of output file
