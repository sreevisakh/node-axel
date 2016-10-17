import q from 'q';
import EventEmitter from 'events';

class Axel extends EventEmitter {
    constructor(options) {
        super();

        this.testAxel();

        if (!options)
            return;
        /*
            You  can  specify  a speed (bytes per second) here and Axel will
            try to keep the average speed around this speed. Useful  if  you
            don't want the program to suck up all of your bandwidth.
        */
        this.maxspeed = options.maxspeed;
        /*
             You can specify an alternative number of connections here.
        */
        this.connections = options.connections;
        /*
             You can specify an custom headers.
        */
        this.headers = options.headers;

        this.output = options.output;

        this.speed = 0;
        this.progress = 0.0
        this.size = 0;
        this.errors = [
            '404 Not Found', '502 Bad Gateway', '504 Gateway Timeout'
        ]

    }
    getCommandWithArgs() {
        let command = [];
        (this.maxspeed) ? command.push('-s ' + this.maxspeed): '';
        (this.connections) ? command.push('-n ' + this.connections): '';
        (this.output) ? command.push('-o ' + this.output): '';

        if (this.headers) {
            this.headers.map((header) => command.push('-H' + header));
        }
        return command;
    }
    emitLines(stream) {
        var backlog = ''
        stream.on('data', function(data) {
            backlog += data
            var n = backlog.indexOf('\n')
                // got a \n? emit one or more 'line' events
            while (~n) {
                stream.emit('line', backlog.substring(0, n))
                backlog = backlog.substring(n + 1)
                n = backlog.indexOf('\n')
            }
        })
        stream.on('end', function() {
            if (backlog) {
                stream.emit('line', backlog)
            }
        })
    }
    download(url) {

        this.defer = q.defer();

        if (!url) {
            this.emit('error', 'Invalid url')
            this.promise.reject('Invalid Url');
            return this.getProgress();
        }


        let command = this.getCommandWithArgs();
        command.push(url);
        let spawn = require('child_process').spawn('axel', command)

        process.on('exit', function() {
            spawn.kill();
        });


        this.emitLines(spawn.stdout);
        spawn.stdout.on('line', data => {
            // console.log('Line: ', data.toString());
            this.emit('progress', this.update(data));

        })
        spawn.stderr.on('data', data => {
            // console.log(`stderr: ${data}`);
            this.emit('error', data);
            this.defer.reject(data);
        });

        spawn.stdout.on('close', () => {
            // console.log('Close: ', data);
            this.progress = 100;
            this.speed = 0;
            this.emit('progress', this.getProgress());
            this.emit('finish');
            this.defer.resolve();
        })
        this.promise = this.defer.promise;
        return this;

    }
    update(line) {
        let progress = /\[\s+(\d+)%\]/.exec(line);
        if (progress && progress[1]) {
            this.progress = progress[1];
            // console.log('Progress :', this.progress);
        }
        let speed = /([0-9]+\.[0-9]+)KB\/s\]/.exec(line);
        if (speed && speed[1]) {
            this.speed = speed[1];
            // console.log('Speed : ', this.speed)
        }
        this.errors.map(error => {
            if (1 + line.indexOf(error)) {
                this.emit('error', error);
                this.defer.reject(error);
            }
        })

        if (!this.size) {
            let size = /File size: (\d+)/.exec(line);
            if (size && size[1]) {
                this.size = size[1];
                // console.log('Size : ', this.size)
            }
        }

        return this.getProgress();

    }
    getProgress() {
        return {
            speed: this.speed,
            progress: this.progress,
            size: this.size
        }
    }
    testAxel() {
        try {
            var child = require('child_process')
            var spawn = child.spawn('axel');
        } catch (error) {

        }
        spawn.on('error', () => {
            console.error('axel command not found');
        })
    }

}

module.exports = Axel;
export default Axel;